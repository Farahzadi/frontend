import { createIcon } from "@download/blockies";
import { State } from "lib/utils";
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

  state = new NetworkInterface.State();

  NETWORK = "unknown";
  HAS_BRIDGE = false;
  BRIDGE_CONTRACT = "";

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
      HAS_BRIDGE: this.HAS_BRIDGE,
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

  async updateBalances() {
    if (!this.apiProvider) return;
    const balances = await this.apiProvider.getBalances();
    this.userDetails.balances = balances;
  }

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
    return {
      ...userDetails,
      name: await this.getProfileName(address),
      image: await this.getProfileImage(address),
    };
  }

  async getProfileImage(address) {
    if (!address) throw new Error("profile request for undefined address");
    return createIcon({ seed: address }).toDataURL();
  }

  async getProfileName(address) {
    return `${address.substr(0, 6)}…${address.substr(-6)}`;
  }

  async prepareOrder(product, side, price, amount, feeType, fee, orderType) {
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
