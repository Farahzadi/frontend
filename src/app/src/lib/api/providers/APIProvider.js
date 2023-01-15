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

  // network name used in web3modal
  NETWORK_NAME = "mainnet";

  state = new APIProvider.State();

  /// Methods required to be implemented

  async start() {
    return notImplemented("start");
  }

  async stop() {
    return notImplemented("stop");
  }

  async prepareOrder() {
    return notImplemented("submitOrder");
  }

  async depositL2() {
    return notImplemented("depositL2");
  }

  async withdrawL2() {
    return notImplemented("withdrawL2");
  }

  async depositL2Fee() {
    return notImplemented("depositL2Fee");
  }

  async withdrawL2Fee() {
    return notImplemented("withdrawL2Fee");
  }

  async wrap() {
    return notImplemented("wrap");
  }

  async unwrap() {
    return notImplemented("unwrap");
  }

  async getEvent() {
    return notImplemented("getEvent");
  }

  async getBalances() {
    return notImplemented("getBalances");
  }

  async signMessage() {
    return notImplemented("signMessage");
  }

  async verifyMessage() {
    return notImplemented("verifyMessage");
  }

  // returns true if the network did switch and false if it didn't (or didn't need to)
  async switchNetwork() {
    return notImplemented("switchNetwork");
  }

  async onAccountChange() {
    return notImplemented("onAccountChange");
  }

  emit(msg, ...args) {
    this.networkInterface.emit(msg, ...args);
  }

  constructor(networkInterface, onStateChange) {
    this.networkInterface = networkInterface;
    this.state.onChange = onStateChange;
  }

}
