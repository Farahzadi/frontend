import ZKSyncAPIProvider from "./ZKSyncAPIProvider";

export default class ZKSyncGoerliAPIProvider extends ZKSyncAPIProvider {
  NETWORK = "zksyncv1_goerli";
  NETWORK_NAME = "goerli";
  BRIDGE_CONTRACT = "0x5c56FC5757259c52747AbB7608F8822e7cE51484";
  ZKSYNC_BASE_URL = "https://goerli-api.zksync.io/api/v0.2";
}
