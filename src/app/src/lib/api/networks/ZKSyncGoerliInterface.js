import ZKSyncGoerliAPIProvider from "../providers/ZKSyncGoerliAPIProvider";
import ZKSyncInterface from "./ZKSyncInterface";

export default class ZKSyncGoerliInterface extends ZKSyncInterface {
  static Provider = ZKSyncGoerliAPIProvider;
  NETWORK = "zksyncv1_goerli";
}
