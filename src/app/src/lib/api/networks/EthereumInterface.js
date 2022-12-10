import EthAPIProvider from "../providers/EthAPIProvider";
import NetworkInterface from "./NetworkInterface";

export default class EthereumInterface extends NetworkInterface {
  static Provider = EthAPIProvider;
  NETWORK = "ethereum";
}