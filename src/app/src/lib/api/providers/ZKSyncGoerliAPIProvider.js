import ZKSyncAPIProvider from "./ZKSyncAPIProvider";

export default class ZKSyncGoerliAPIProvider extends ZKSyncAPIProvider {
  BRIDGE_CONTRACT = "0x5c56FC5757259c52747AbB7608F8822e7cE51484";
  ZK_NETWORK_NAME = "goerli";
}
