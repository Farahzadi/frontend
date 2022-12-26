import ZKSyncAPIProvider from "./ZKSyncAPIProvider";

export default class ZKSyncGoerliAPIProvider extends ZKSyncAPIProvider {
  NETWORK_NAME = "goerli";
  ZKSYNC_BASE_URL = "https://goerli-api.zksync.io/api/v0.2";
}
