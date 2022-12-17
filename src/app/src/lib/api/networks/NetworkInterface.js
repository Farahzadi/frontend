import { createIcon } from "@download/blockies";
import Decimal from "decimal.js";
import store from "lib/store";
import {
  lastPricesSelector,
  marketInfoSelector,
  userOrdersSelector,
} from "lib/store/features/api/apiSlice";
import { getCurrentValidUntil, State, toBaseUnit } from "lib/utils";
import { isString } from "lodash";
import { toast } from "react-toastify";
import APIProvider from "../providers/APIProvider";

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

  static Actions = ["connectWallet", "disconnectWallet"];

  static Provider = APIProvider;

  static ValidSides = ["s", "b"];

  state = new NetworkInterface.State();

  NETWORK = "unknown";
  CURRENCY = "CURRENCY_SYMBOL";
  HAS_BRIDGE = false;
  SECURITY_TYPE = null;
  BRIDGE_CONTRACT = null;
  DEX_CONTRACT = null;

  core = null;

  apiProvider = null;

  userDetails = {
    address: null,
    nonce: null,
    balances: null,
    chainDetails: null,
  };

  shouldSignOut = false;

  constructor({ core, signInMessage }) {
    this.core = core;
    this.signInMessage = signInMessage ?? "Login to Dexpresso";
  }

  async stop() {
    await this.stopAPIProvider();
  }

  getConfig() {
    return {
      hasBridge: this.HAS_BRIDGE,
      securityType: this.SECURITY_TYPE,
    };
  }

  async connectWallet() {
    await this.disconnectWallet();
    try {
      await this.startAPIProvider();
      await this.signIn();
    } catch (err) {
      console.log("Wallet connection failed with error, disconnecting.", err);
      await this.disconnectWallet();
    }
  }

  async disconnectWallet() {
    await this.signOut();
    await this.stopAPIProvider();
    this.emit("balanceUpdate", "wallet", {});
    this.emit("balanceUpdate", this.NETWORK, {});
    this.emit("accountState", {});
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
      if (this.state.get() !== NetworkInterface.State.SIGNED_OUT)
        await this.signOut();
      this.state.set(translatedState);
    }
    this.emit("providerStateChange", state);
  }

  async startAPIProvider() {
    if (this.apiProvider) return;
    const APIProviderClass = this.getAPIProviderClass();
    this.apiProvider = new APIProviderClass(this, this.onProviderStateChange);

    let result;
    try {
      result = await this.apiProvider.start();
    } catch (err) {
      console.error("Error on connecting to provider:", err);
      throw err;
    }

    if (result === "redirectToBridge") {
      // const isBrige = !/^\/bridge(\/.*)?$/.test(window.location.pathname);
      // if (!isBrige) {
      //   // window.history.pushState("/bridge");
      //   toast.error(
      //     "Account not found. Please use the bridge to deposit funds before trying again."
      //   );
      // }
      toast.info(
        <>
          Account not activated. Please activate your account first:{" "}
          <a
            href="https://wallet.zksync.io/?network=goerli"
            style={{ color: "white" }}
            target="_blank"
            rel="noreferrer"
          >
            {" "}
            go to wallet.zksync.io
          </a>
        </>
      );
      throw new Error();
    }

    this.apiProvider.onAccountChange(this.disconnectWallet);
  }

  async stopAPIProvider() {
    this.apiProvider?.stop();
    delete this.apiProvider;
    this.apiProvider = null;
  }

  async signIn() {
    const { uuid } = this.core.ws;
    const network = this.NETWORK;
    let accountState;
    if (this.state.get() !== NetworkInterface.State.PROVIDER_CONNECTED)
      throw new Error("SignIn Error: wallet not connected");
    if (!uuid) throw new Error("SignIn Error: UUID not set");

    this.state.set(NetworkInterface.State.SIGNING_IN);

    const address = await this.apiProvider.getAddress();

    const networkKey = `login:${network}`;

    let signature = sessionStorage.getItem(networkKey);

    const shouldSign =
      !signature ||
      !(await this.apiProvider.verifyMessage(this.signInMessage, signature));

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

    this.emit("userChanged", address);

    await this.core.sendRequest("login", "POST", {
      network: network,
      address: address,
      signature: signature,
      user_data: true,
      uuid,
    });

    try {
      accountState = await this.getAccountState();
    } catch (err) {
      this.state.set(NetworkInterface.State.SIGNED_IN);
      throw err;
    }

    this.emit("signIn", accountState);
    this._accountState = accountState;

    this.state.set(NetworkInterface.State.SIGNED_IN);

    if (this.shouldSignOut) this.signOut();

    return accountState;
  }

  async signOut() {
    const state = this.state.get();
    this.shouldSignOut = false;
    if (state !== NetworkInterface.State.SIGNED_IN) {
      if (state === NetworkInterface.State.SIGNING_IN)
        this.shouldSignOut = true;
      return;
    }
    this.state.set(NetworkInterface.State.SIGNING_OUT);
    this._accountState = null;
    sessionStorage.removeItem("access_token");
    this.state.set(NetworkInterface.State.SIGNED_OUT);
  }

  async updateAddress() {
    if (!this.apiProvider) return;
    const address = await this.apiProvider.getAddress();
    this.userDetails.address = address;
  }

  async getAddress() {
    return this.userDetails.address;
  }

  async updateNonce() {
    if (!this.apiProvider) return;
    const address = await this.apiProvider.getNonce();
    this.userDetails.address = address;
  }

  async getNonce() {
    return this.userDetails.nonce;
  }

  async updateBalances() {}

  async getBalances() {
    return this.userDetails.balances;
  }

  async updateChainDetails() {
    // if (!this.apiProvider) return;
    // const allowances = await this.apiProvider.getAllowances(...args);
    // if (!this.userDetails.chainDetails) this.userDetails.chainDetails = {};
    // this.userDetails.chainDetails.allowances = allowances;
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
    const address = this.getAddress();
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

  async getAvailableBalance(currency, decimals, giveDecimal = false) {
    const balances = await this.getBalances();
    if (!balances[currency]?.value) return "0";
    let balance = new Decimal(balances[currency].value);
    Object.entries(userOrdersSelector(store.getState())).forEach(
      (id, order) => {
        if (this.NETWORK !== order.chainId) return;
        const [base, quote] = order.market.split("-");
        if (order.side === "b" && quote === currency)
          balance = balance.sub(toBaseUnit(order.quoteQuantity, decimals));
        if (order.side === "s" && base === currency)
          balance = balance.sub(toBaseUnit(order.baseQuantity, decimals));
      }
    );
    return giveDecimal ? balance : balance.toFixed(0);
  }

  async validateOrder({ market, price, amount, side, fee, type }) {
    class VError extends Error() {}
    try {
      if (!market) throw new VError("Invalid market");

      const currencies = this.core.getNetworkCurrencies(this.NETWORK);
      const [baseCurrency, quoteCurrency] = market.split("-");
      const [baseDecimals, quoteDecimals] = [
        currencies[baseCurrency].decimals,
        currencies[quoteCurrency].decimals,
      ];
      const [baseTokenAddress, quoteTokenAddress] = [
        currencies[baseCurrency].info.contract,
        currencies[quoteCurrency].info.contract,
      ];

      try {
        amount = new Decimal(toBaseUnit(amount, baseDecimals));
      } catch (err) {
        throw new VError("Invalid amount");
      }

      try {
        price = new Decimal(price).toFixed();
      } catch (err) {
        throw new VError("Invalid price");
      }
      if (price.eq(0)) throw new VError(`Price should not be equal to 0`);

      if (side === "buy") side = "b";
      if (side === "sell") side = "s";
      if (!isString(side) || !["b", "s"].includes(side))
        throw new VError("Invalid side");

      const [buyTokenAddress, sellTokenAddress] =
        side === "b"
          ? [baseTokenAddress, quoteTokenAddress]
          : [quoteTokenAddress, baseTokenAddress];

      try {
        fee = new Decimal(fee);
        if (fee.gt(1)) throw new Error();
        if (fee.lt(0)) throw new Error();
      } catch (err) {
        throw new VError("Invalid fee");
      }

      if (!isString(type) || !["l", "m"].includes(type))
        throw new VError("Invalid order type");

      await this.updateBalances();

      const baseBalance = await this.getAvailableBalance(
        baseCurrency,
        baseDecimals,
        true
      );
      const quoteBalance = await this.getAvailableBalance(
        quoteCurrency,
        quoteDecimals,
        true
      );

      const state = store.getState();

      if (side === "s" && baseBalance.lt(amount))
        throw new VError(`Amount exceeds ${baseCurrency} balance`);

      if (side === "b" && quoteBalance.lt(amount.mul(price)))
        throw new VError(`Total exceeds ${quoteCurrency} balance`);

      const minOrderSize = new Decimal(
        marketInfoSelector(state).min_order_size
      );
      if (amount.lt(minOrderSize))
        throw new VError(
          `Minimum order size is ${minOrderSize.toFixed()} ${baseCurrency}`
        );

      const lastPrice = new Decimal(lastPricesSelector(state));

      const warnings = [];

      if (price > lastPrice.mul(1.2))
        warnings.push("Price is 20% above the spot");
      if (price < lastPrice.mul(0.8))
        warnings.push("Price is 20% lower than the spot");

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
      };

      return data;
    } catch (err) {
      if (err instanceof VError) throw err;
      console.error("Order Validation Error:", err);
      throw new Error("Unknown Error: Check console for more info");
    }
  }

  async prepareOrder({
    market,
    amount,
    price,
    side,
    buyTokenAddress,
    sellTokenAddress,
    fee,
    type,
    validUntil,
  }) {
    const tx = this.apiProvider.signOrder({
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
}
