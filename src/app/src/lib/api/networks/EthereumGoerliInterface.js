import EthGoerliAPIProvider from "../providers/EthGoerliAPIProvider";
import EthereumInterface from "./EthereumInterface";

export default class EthereumGoerliInterface extends EthereumInterface {
  static Provider = EthGoerliAPIProvider;
  NETWORK = "ethereum_goerli";
  CHAIN_ID = 5;
}