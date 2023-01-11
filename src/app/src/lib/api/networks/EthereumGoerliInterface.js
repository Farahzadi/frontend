import EthGoerliAPIProvider from "../providers/EthGoerliAPIProvider";
import EthereumInterface from "./EthereumInterface";

const ETHEREUM_GOERLI_DEX_CONTRACT = process.env.REACT_APP_ETHEREUM_GOERLI_DEX_CONTRACT;
export default class EthereumGoerliInterface extends EthereumInterface {

  static Provider = EthGoerliAPIProvider;
  NETWORK = "ethereum_goerli";
  CHAIN_ID = 5;
  DEX_CONTRACT = ETHEREUM_GOERLI_DEX_CONTRACT;

}
