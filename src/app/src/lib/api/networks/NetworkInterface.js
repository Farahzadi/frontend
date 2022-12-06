import Decimal from "decimal.js";
import { createIcon } from "@download/blockies";
import Emitter from "tiny-emitter";
import { ethers } from "ethers";

import { getENSName } from "lib/ens";
import { formatAmount, State } from "lib/utils";
import erc20ContractABI from "lib/contracts/ERC20.json";
import { maxAllowance } from "../constants";
import axios from "axios";
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

  static Provider = APIProvider;

  state = new NetworkInterface.State();

  NETWORK = "unknown";
  HAS_BRIDGE = false;
  BRIDGE_CONTRACT = "";

  core = null;

  apiProvider = null;

  shouldSignOut = false;

  constructor({ core, signInMessage }) {
    this.core = core;
    this.signInMessage = signInMessage ?? "Login to Dexpresso";
  }

  stop = async () => {
    await this.stopAPIProvider();
  };

  getConfig = () => {
    return {
      HAS_BRIDGE: this.HAS_BRIDGE,
    };
  };

  connectWallet = async () => {
    await this.disconnectWallet();
    try {
      await this.startAPIProvider();
      await this.signIn();
    } catch (err) {
      console.log("Wallet connection failed with error, disconnecting.", err);
      await this.disconnectWallet();
    }
  };

  disconnectWallet = async () => {
    await this.signOut();
    await this.stopAPIProvider();
    this.emit("balanceUpdate", "wallet", {});
    this.emit("balanceUpdate", this.NETWORK, {});
    this.emit("accountState", {});
    this.emit("signOut");
  };

  onProviderStateChange = async (state) => {
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
  };

  startAPIProvider = async () => {
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
          >
            {" "}
            go to wallet.zksync.io
          </a>
        </>
      );
      throw new Error();
    }

    this.apiProvider.onAccountChange(this.disconnectWallet);
  };

  stopAPIProvider = async () => {
    this.apiProvider?.stop();
    delete this.apiProvider;
    this.apiProvider = null;
  };

  _fetchENSName = async (address) => {
    let ENS = {};
    try {
      await getENSName(address).then((res) => (ENS.name = res));
      if (ENS.name) return ENS;
      return {};
    } catch (err) {
      console.log(`ENS error: ${err}`);
    }
  };

  getAccountState = async () => {
    // if(![NetworkInterface.State.PROVIDER_CONNECTED, NetworkInterface.State.SIGNED_IN, NetworkInterface.State.SIGNING_IN
    //   NetworkInterface.State.].includes(this.state.get()))
    if (!this.apiProvider) return {};
    const accountState = { ...(await this.apiProvider.getAccountState()) };
    accountState.profile = await this.core.getProfile(accountState.address);
    this.emit("accountState", accountState);
    return accountState;
  };

  signIn = async () => {
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
  };

  signOut = async () => {
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
  };

  verifiedAccountNonce = async () => {
    return await this._accountState.verified.nonce;
  };

  increaseWalletNonce = async () => {
    let increaseNonceResult = {};

    const increaseNonceRes = await this.apiProvider.increaseWalletNonce();
    // cancel all orders if wallet nonce is increased
    this.cancelAllOrders();
    const verifiedAccountNonce = await this._accountState.verified.nonce;
    if (increaseNonceRes) {
      increaseNonceResult.response = increaseNonceRes;
      increaseNonceResult.verifiedAccountNonce = verifiedAccountNonce;
    }

    return increaseNonceResult;
  };

  depositL2 = async (amount, token) => {
    return this.apiProvider.depositL2(amount, token);
  };

  withdrawL2 = async (amount, token) => {
    return this.apiProvider.withdrawL2(amount, token);
  };

  depositL2Fee = async (token) => {
    return this.apiProvider.depositL2Fee(token);
  };

  withdrawL2Fee = async (token) => {
    return this.apiProvider.withdrawL2Fee(token);
  };

  getCommitedBalance = async () => {
    const commitedBalance = this.apiProvider.getCommitedBalance();
    if (commitedBalance) {
      return commitedBalance;
    } else {
      return 0;
    }
  };

  getNetworkContract = () => {
    return this.BRIDGE_CONTRACT;
  };

  approveSpendOfCurrency = async (currency, allowance = maxAllowance) => {
    return await this.apiProvider?.approveSpendOfCurrency(
      currency,
      allowance || maxAllowance,
      erc20ContractABI
    );
  };

  getBalanceOfCurrency = async (currency) => {
    return await this.apiProvider?.getBalanceOfCurrency(
      currency,
      erc20ContractABI,
      maxAllowance
    );
  };

  getWalletBalances = async () => {
    if (!this.apiProvider) return null;
    const balances = {};

    const getBalance = async (ticker) => {
      const { balance, allowance } = await this.getBalanceOfCurrency(ticker);
      balances[ticker] = {
        value: balance,
        allowance,
        valueReadable: formatAmount(balance, this.core.currencies[ticker]),
      };

      this.emit("balanceUpdate", "wallet", { ...balances });
    };
    let tickers;
    try {
      tickers = Object.keys(this.core.currencies).filter(
        (ticker) => this.core.currencies[ticker].chain[this.network]
      );
    } catch (err) {
      return null;
    }

    await Promise.all(tickers.map((ticker) => getBalance(ticker)));

    return balances;
  };

  getBalances = async () => {
    if (!this.apiProvider) return null;
    const balances = await this.apiProvider.getBalances();
    this.emit("balanceUpdate", this.network, balances);
    return balances;
  };

  prepareOrder = async (
    product,
    side,
    price,
    amount,
    feeType,
    fee,
    orderType
  ) => {
    if (!this.isSignedIn()) return;
    return await this.apiProvider.prepareOrder(
      product,
      side,
      price,
      amount,
      feeType,
      fee,
      orderType
    );
  };

  isSignedIn = () => {
    return sessionStorage.getItem("access_token") !== null;
  };

  getAPIProviderClass = () => {
    return this.constructor.Provider;
  };

  emit = (msg, ...args) => {
    this.core.emit(msg, ...args);
  };
}
