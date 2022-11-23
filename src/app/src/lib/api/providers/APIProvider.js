const notImplemented = function (method) {
  const x = () => {
    throw new Error(`APIProvider method not implemented: ${method}`);
  };
  x.notImplemented = true;
  return x;
};

export default class APIProvider {
  static State = class {
    static DISCONNECTED = "DISCONNECTED";
    static CONNECTING = "CONNECTING";
    static CONNECTED = "CONNECTED";
    static SWITCHING = "SWITCHING";
    static DISCONNECTING = "DISCONNECTING";

    _state = "DISCONNECTED";

    onChange;

    set = (state) => {
      if (!Object.keys(APIProvider.State).includes(state)) return;
      const prev = this._state;
      this._state = state;
      if (prev !== state) this.onChange?.(state);
    };

    get = () => {
      return this._state;
    };
  };

  /// Common fields

  // network name used in backend api calls
  NETWORK = "ethereum";
  // network name used in web3modal
  NETWORK_NAME = "mainnet";
  // address of smart contract used for bridge functionality
  BRIDGE_CONTRACT = "0x0000000000000000000000000000000000000000";

  state = new APIProvider.State();

  /// Methods required to be implemented

  start = notImplemented("start");
  stop = notImplemented("stop");
  signIn = notImplemented("signIn");
  signOut = notImplemented("signOut");
  getAccountState = notImplemented("getAccountState");
  submitOrder = notImplemented("submitOrder");
  submitSwap = notImplemented("submitSwap");
  depositL2 = notImplemented("depositL2");
  withdrawL2 = notImplemented("withdrawL2");
  depositL2Fee = notImplemented("depositL2Fee");
  withdrawL2Fee = notImplemented("withdrawL2Fee");
  getBalances = notImplemented("getBalances");
  getProfile = notImplemented("getProfile");

  signMessage = notImplemented("signMessage");
  verifyMessage = notImplemented("verifyMessage");
  switchNetwork = notImplemented("switchNetwork");

  onAccountChange = notImplemented("onAccountChange");

  constructor(api, onStateChange) {
    this.api = api;
    this.state.onChange = onStateChange;
  }
}
