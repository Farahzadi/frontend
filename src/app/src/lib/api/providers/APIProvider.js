import { State } from "lib/utils";

const notImplemented = function (method) {
  const x = () => {
    throw new Error(`APIProvider method not implemented: ${method}`);
  };
  x.notImplemented = true;
  return x;
};

export default class APIProvider {
  static State = class extends State {
    static DISCONNECTED = "DISCONNECTED";
    static CONNECTING = "CONNECTING";
    static CONNECTED = "CONNECTED";
    static SWITCHING = "SWITCHING";
    static DISCONNECTING = "DISCONNECTING";

    _state = "DISCONNECTED";
  };

  /// Common fields

  // network name used in backend api calls
  NETWORK = "ethereum";
  // network name used in web3modal
  NETWORK_NAME = "mainnet";
  // address of smart contract used for bridge functionality
  BRIDGE_CONTRACT = "0x0000000000000000000000000000000000000000";
  // either we supports a bridge for this network
  HAS_BRIDGE = false;

  state = new APIProvider.State();

  /// Methods required to be implemented

  start = notImplemented("start");
  stop = notImplemented("stop");
  getAccountState = notImplemented("getAccountState");
  prepareOrder = notImplemented("submitOrder");
  depositL2 = notImplemented("depositL2");
  withdrawL2 = notImplemented("withdrawL2");
  depositL2Fee = notImplemented("depositL2Fee");
  withdrawL2Fee = notImplemented("withdrawL2Fee");
  getBalances = notImplemented("getBalances");
  getProfile = notImplemented("getProfile");

  signMessage = notImplemented("signMessage");
  verifyMessage = notImplemented("verifyMessage");
  
  // returns true if the network did switch and false if it didn't (or didn't need to)
  switchNetwork = notImplemented("switchNetwork");

  onAccountChange = notImplemented("onAccountChange");

  emit = (msg, ...args) => {
    this.networkInterface.emit(msg, ...args);
  };

  constructor(networkInterface, onStateChange) {
    this.networkInterface = networkInterface;
    this.state.onChange = onStateChange;
  }
}
