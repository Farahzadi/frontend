import { createIcon } from "@download/blockies";
import { getNetworkCurrencies } from "config/Currencies";
import Decimal from "decimal.js";
import {
  configSelector,
  lastPricesSelector,
  marketInfoSelector,
  marketSummarySelector,
  networkListSelector,
  userOrdersSelector,
  userSelector,
} from "lib/store/features/api/apiSlice";
import { formatBalances, getCurrentValidUntil, State, toBaseUnit } from "lib/utils";
import { isString } from "lodash";
import { connectWallet } from "../Actions";
import { updateUserNonce } from "../init";
import APIProvider from "../providers/APIProvider";
import { Stage, StageManager } from "../utils/Stage";

export default class NetworkInterface {

  static State = class extends State {

    static DISCONNECTED = "DISCONNECTED";
    static PROVIDER_CONNECTING = "PROVIDER_CONNECTING";
    static PROVIDER_CONNECTED = "PROVIDER_CONNECTED";
    static SIGNING_IN = "SIGNING_IN";
    static SIGNED_IN = "SIGNED_IN";
    static SIGNING_OUT = "SIGNING_OUT";
    static SIGNED_OUT = "SIGNED_OUT";
    static PROVIDER_DISCONNECTING = "PROVIDER_DISCONNECTING";

    _state = "DISCONNECTED";

  };

  static Actions = [
    connectWallet,
    "disconnectWallet",
    "updateAddress",
    "updateNonce",
    "updateBalances",
    "updateAvailableBalances",
    "updateChainDetails",
    "updateUserDetails",
    "updateUserState",
    "updateUserBalancesState",
    "updateUserChainDetailsState",
  ];

  static Provider = APIProvider;

  static ValidSides = ["s", "b"];

  state = new NetworkInterface.State();

  NETWORK = "unknown";
  CURRENCY = "CURRENCY_SYMBOL";
  HAS_CONTRACT = false;
  HAS_BRIDGE = false;
  HAS_WRAPPER = false;
  SECURITY_TYPE = null;
  BRIDGE_CONTRACT = null;
  DEX_CONTRACT = null;

  core = null;

  apiProvider = null;

  userDetails = {
    address: null,
    nonce: null,
    balances: null,
    availableBalances: null,
    chainDetails: null,
  };

  shouldSignOut = false;

  stageManager = new StageManager(this.getStages(), "CONNECT", ["DISCONNECTED"], () => this.setStagesInitialStates());

  constructor({ core, signInMessage }) {
    this.core = core;
    this.signInMessage = signInMessage ?? "Login to Dexpresso";
    this.setStagesInitialStates();
    this.stageManager.start();
  }

  async stop() {
    await this.disconnectWallet();
  }

  getConfig() {
    return {
      hasBridge: this.HAS_BRIDGE,
      hasWrapper: this.HAS_WRAPPER,
      hasContract: this.HAS_CONTRACT,
      securityType: this.SECURITY_TYPE,
    };
  }

  async connectWallet() {
    await this.disconnectWallet();
    this.stageManager.emit("CONNECTING");
    try {
      await Promise.all([this.core.ws.uuidPromise, this.startAPIProvider()]);
      await this.signIn();
      this.stageManager.emit("CONNECTED");
    } catch (err) {
      console.log("Wallet connection failed with error, disconnecting.", err);
      await this.disconnectWallet();
    }
  }

  async disconnectWallet() {
    await this.signOut();
    await this.stopAPIProvider();
    this.stageManager.emit("DISCONNECTED");
    this.emit("signOut");
  }

  async onProviderStateChange(state) {
    const mapping = {
      DISCONNECTED: "DISCONNECTED",
      CONNECTING: "PROVIDER_CONNECTING",
      CONNECTED: "PROVIDER_CONNECTED",
      DISCONNECTING: "PROVIDER_DISCONNECTING",
    };
    const translatedState = mapping[state];
    if (translatedState) {
      if (this.state.get() !== NetworkInterface.State.SIGNED_OUT) await this.signOut();
      this.state.set(translatedState);
    }
    this.emit("providerStateChange", state);
  }

  async startAPIProvider() {
    if (this.apiProvider) return;
    const APIProviderClass = this.getAPIProviderClass();
    this.apiProvider = new APIProviderClass(this, state => this.onProviderStateChange(state));

    let result;
    try {
      result = await this.apiProvider.start(this.core.infuraId, true);
    } catch (err) {
      console.error("Error on connecting to provider:", err);
      throw err;
    }

    // if (result === "redirectToBridge") {
    //   // const isBrige = !/^\/bridge(\/.*)?$/.test(window.location.pathname);
    //   // if (!isBrige) {
    //   //   // window.history.pushState("/bridge");
    //   //   Core.run("notify", "error", "Account not found. Please use the bridge to deposit funds before trying again.");
    //   // }
    //   Core.run("notify", "info",
    //     <>
    //       Account not activated. Please activate your account first:{" "}
    //       <a
    //         href="https://wallet.zksync.io/?network=goerli"
    //         style={{ color: "white" }}
    //         target="_blank"
    //         rel="noreferrer">
    //         {" "}
    //         go to wallet.zksync.io
    //       </a>
    //     </>
    //   );
    //   throw new Error();
    // }

    this.apiProvider.onAccountChange(() => this.disconnectWallet());
  }

  async stopAPIProvider() {
    this.apiProvider?.stop();
    delete this.apiProvider;
    this.apiProvider = null;
  }

  async signIn(finalChecks = true) {
    const { uuid } = this.core.ws;
    const network = this.NETWORK;
    if (this.state.get() !== NetworkInterface.State.PROVIDER_CONNECTED)
      throw new Error("SignIn Error: wallet not connected");
    if (!uuid) throw new Error("SignIn Error: UUID not set");

    this.state.set(NetworkInterface.State.SIGNING_IN);

    const address = await this.apiProvider.getAddress();

    const networkKey = `login:${network}`;

    let signature = sessionStorage.getItem(networkKey);

    const shouldSign = !signature || !(await this.apiProvider.verifyMessage(this.signInMessage, signature));

    if (shouldSign) {
      sessionStorage.removeItem(networkKey);
      signature = await this.apiProvider.signMessage(this.signInMessage);
      if (!signature) {
        const err = new Error("Signing failed.");
        console.error("Error on signing message:", err);
        throw err;
      }
      sessionStorage.setItem(networkKey, signature);
    }

    this.emit("updateUserAddress", address);

    await this.core.sendRequest("login", "POST", {
      network: network,
      address: address,
      signature: signature,
      user_data: true,
      uuid,
    });
    if (finalChecks) {
      await this.updateUserState(true);
      this.state.set(NetworkInterface.State.SIGNED_IN);
      if (this.shouldSignOut) this.signOut();
    }
  }

  async signOut() {
    const state = this.state.get();
    this.shouldSignOut = false;
    if (state !== NetworkInterface.State.SIGNED_IN) {
      if (state === NetworkInterface.State.SIGNING_IN) this.shouldSignOut = true;
      return;
    }
    this.state.set(NetworkInterface.State.SIGNING_OUT);
    this._accountState = null;
    sessionStorage.removeItem("access_token");
    this.state.set(NetworkInterface.State.SIGNED_OUT);
  }

  async _updateAddress() {
    if (!this.apiProvider) return;
    const address = await this.apiProvider.getAddress();
    this.userDetails.address = address;
  }

  async updateAddress(...args) {
    const result = await this._updateAddress(...args);
    this.stageManager.emit("ADDRESS_UPDATED", this.userDetails.address);
    return result;
  }

  async getAddress() {
    return this.userDetails.address;
  }

  async _updateNonce() {
    if (!this.apiProvider) return;
    const nonce = await this.apiProvider.getNonce();
    this.userDetails.nonce = nonce;
  }

  async updateNonce(...args) {
    const result = await this._updateNonce(...args);
    this.stageManager.emit("NONCE_UPDATED", this.userDetails.nonce);
    this.emit(updateUserNonce, this.userDetails.nonce);
    return result;
  }

  getNonce() {
    return this.userDetails.nonce;
  }

  async updatePureBalances() {}

  async updateBalances(...args) {
    await this.updatePureBalances(...args);
    this.stageManager.emit("BALANCES_UPDATED", this.userDetails.balances);
    await this.updateAvailableBalances(...args);
  }

  async getBalances() {
    return this.userDetails.balances;
  }

  async _updateAvailableBalances() {
    if (!this.getBalances()) return;
    const currencies = getNetworkCurrencies(this.NETWORK);
    const entriesPromises = Object.entries(currencies).map(async ([ticker, currency]) => [
      ticker,
      await this.getAvailableBalance(ticker, currency.decimals),
    ]);
    const entries = await Promise.all(entriesPromises);
    const availableBalances = Object.fromEntries(entries);
    this.userDetails.availableBalances = formatBalances(availableBalances, currencies);
    return availableBalances;
  }

  async updateAvailableBalances(...args) {
    const result = await this._updateAvailableBalances(...args);
    this.stageManager.emit("AVAILABLE_BALANCES_UPDATED", this.userDetails.availableBalances);
    return result;
  }

  async getAvailableBalances() {
    return this.userDetails.availableBalances;
  }

  async _updateChainDetails() {}

  async updateChainDetails() {
    const result = await this._updateChainDetails();
    this.stageManager.emit("CHAIN_DETAILS_UPDATED", this.userDetails.chainDetails);
    return result;
  }

  async getChainDetails() {
    return this.userDetails.chainDetails;
  }

  async updateUserDetails(...args) {
    await Promise.all([
      this.updateAddress(...args),
      this.updateNonce(...args),
      this.updateBalances(...args),
      this.updateChainDetails(...args),
    ]);
  }

  async getUserDetails() {
    const { userDetails } = this;
    const address = await this.getAddress();
    const name = address && (await this.getProfileName(address));
    const image = address && (await this.getProfileImage(address));
    return {
      ...userDetails,
      name,
      image,
    };
  }

  async getProfileImage(address) {
    if (!address) return null;
    return createIcon({ seed: address }).toDataURL();
  }

  async getProfileName(address) {
    return `${address.substr(0, 6)}…${address.substr(-6)}`;
  }

  async getAvailableBalance(ticker, decimals, giveDecimal = false) {
    const balances = await this.getBalances();
    if (!balances[ticker]?.value) return giveDecimal ? new Decimal(0) : "0";
    let balance = new Decimal(balances[ticker].value);

    const validStatuses = ["o", "b", "pm"];
    Object.entries(userOrdersSelector(this.getStoreState()))
      .filter(([id, order]) => this.NETWORK === order.chainId && validStatuses.includes(order.status))
      .forEach(([id, order]) => {
        const [base, quote] = order.market.split("-");
        if (order.side === "b" && quote === ticker) balance = balance.sub(toBaseUnit(order.quoteQuantity, decimals));
        if (order.side === "s" && base === ticker) balance = balance.sub(toBaseUnit(order.baseQuantity, decimals));
      });
    return giveDecimal ? balance : balance.toFixed(0);
  }

  async updateUserState(shouldFetch = false) {
    if (shouldFetch) await this.updateUserDetails();
    const userDetails = await this.getUserDetails();
    this.emit("updateUser", userDetails);
  }

  async updateUserBalancesState(shouldFetch = false) {
    if (shouldFetch && !this.apiProvider) return;
    if (shouldFetch) await this.updateBalances();
    const balances = await this.getBalances();
    const availableBalances = await this.getAvailableBalances();
    this.emit("updateUserBalances", balances);
    this.emit("updateUserAvailableBalances", availableBalances);
  }

  async updateUserChainDetailsState(shouldFetch = false) {
    if (shouldFetch && !this.apiProvider) return;
    if (shouldFetch) await this.updateChainDetails();
    const chainDetails = await this.getChainDetails();
    this.emit("updateUserChainDetails", chainDetails);
  }

  async validateOrder({ market, price, amount, side, fee, type }) {
    class VError extends Error {}
    try {
      if (!market) throw new VError("Invalid market");

      const currencies = getNetworkCurrencies(this.NETWORK);
      const [baseCurrency, quoteCurrency] = market.split("-");
      const [baseDecimals, quoteDecimals] = [currencies[baseCurrency].decimals, currencies[quoteCurrency].decimals];
      const [baseTokenAddress, quoteTokenAddress] = [
        currencies[baseCurrency].info.contract,
        currencies[quoteCurrency].info.contract,
      ];

      try {
        amount = new Decimal(toBaseUnit(amount, baseDecimals));
      } catch (err) {
        throw new VError("Invalid amount");
      }
      let unitPrice;
      try {
        price = new Decimal(price);
        unitPrice = Decimal.mul(price, Decimal.pow(10, quoteDecimals - baseDecimals));
      } catch (err) {
        throw new VError("Invalid price");
      }
      if (price.eq(0))
        throw new VError(
          type === "l" ? "Price should not be equal to 0" : "There is no orders in the orderbook to match",
        );

      if (side === "buy") side = "b";
      if (side === "sell") side = "s";
      if (!isString(side) || !["b", "s"].includes(side)) throw new VError("Invalid side");

      const [buyTokenAddress, sellTokenAddress] =
        side === "b" ? [baseTokenAddress, quoteTokenAddress] : [quoteTokenAddress, baseTokenAddress];

      if (!isString(type) || !["l", "m"].includes(type)) throw new VError("Invalid order type");

      await this.updateBalances();

      const baseBalance = await this.getAvailableBalance(baseCurrency, baseDecimals, true);
      const quoteBalance = await this.getAvailableBalance(quoteCurrency, quoteDecimals, true);

      const state = this.getStoreState();

      try {
        if (this.HAS_CONTRACT) {
          const selectedNet = networkListSelector(state).find(net => net.network === this.NETWORK);
          fee = Decimal.div(selectedNet.maxFeeRatio, 1000);
        } else {
          fee = new Decimal(configSelector(state).takerFee);
        }
        if (fee.gt(1)) throw new Error();
        if (fee.lt(0)) throw new Error();
      } catch (err) {
        throw new VError("Invalid fee");
      }

      if (side === "s" && baseBalance.lt(amount)) throw new VError(`Amount exceeds ${baseCurrency} balance`);
      if (side === "b" && quoteBalance.lt(amount.mul(unitPrice)))
        throw new VError(`Total exceeds ${quoteCurrency} balance`);

      const minOrderSize = new Decimal(toBaseUnit(configSelector(state).minOrderSize, baseDecimals));
      if (amount.lt(minOrderSize))
        throw new VError(
          `Minimum order size is ${minOrderSize.div(Decimal.pow(10, baseDecimals)).toFixed()} ${baseCurrency}`,
        );

      const lastPrice = new Decimal(lastPricesSelector(state)[market]?.price ?? price);

      const warnings = [];

      if (price.gt(lastPrice.mul(1.2))) warnings.push("Price is 20% above the spot");
      if (price.lt(lastPrice.mul(0.8))) warnings.push("Price is 20% lower than the spot");

      const ratio = this.getRatio(price.toFixed(), baseDecimals, quoteDecimals);

      const validUntil = getCurrentValidUntil();

      const data = {
        market,
        amount: amount.toFixed(),
        price: price.toFixed(),
        side,
        buyTokenAddress,
        sellTokenAddress,
        fee: fee.toFixed(),
        type,
        validUntil,
        ratio,
        baseCurrency,
        quoteCurrency,
        baseDecimals,
        quoteDecimals,
        unitPrice,
      };
      return data;
    } catch (err) {
      if (err instanceof VError) throw err;
      console.error("Order Validation Error");
      throw new Error("Unknown Error: Check console for more info");
    }
  }

  async prepareOrder({ market, amount, price, side, buyTokenAddress, sellTokenAddress, fee, type, validUntil }) {
    const tx = await this.apiProvider.signOrder({
      market,
      side,
      price,
      amount,
      fee,
      type,
    });
    return {
      tx,
      market,
      amount,
      price,
      type,
    };
  }

  isSignedIn() {
    return sessionStorage.getItem("access_token") !== null;
  }

  getAPIProviderClass() {
    return this.constructor.Provider;
  }

  emit(msg, ...args) {
    this.core.emit(msg, ...args);
  }

  getStoreState() {
    return this.core.store?.getState();
  }

  getRatio(price, baseDecimals = 0, quoteDecimals = 0) {
    const useToBase = baseDecimals && quoteDecimals;
    return {
      base: useToBase ? toBaseUnit("1", baseDecimals) : "1",
      quote: useToBase ? toBaseUnit(price, quoteDecimals) : price,
    };
  }

  setStagesInitialStates() {
    this.emit("setStage", "connection", "DISCONNECTED");
  }

  getStages() {
    return {
      CONNECT: new Stage(
        "READY",
        ["CONNECTING"],
        ["CONNECTED"],
        () => this.emit("setStage", "connection", "DISCONNECTED"),
        () => this.emit("setStage", "connection", "CONNECTING"),
        () => this.emit("setStage", "connection", "CONNECTED"),
      ),
      READY: new Stage("CONNECT", [], ["DISCONNECTED"], () => console.log("Reached READY stage")),
    };
  }

}
