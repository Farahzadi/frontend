import { SecurityComp } from "components/pages/Security/types";
import ZKSyncGoerliAPIProvider from "../providers/ZKSyncGoerliAPIProvider";
import ZKSyncInterface from "./ZKSyncInterface";

export default class ZKSyncGoerliInterface extends ZKSyncInterface {
  static Provider = ZKSyncGoerliAPIProvider;
  NETWORK = "zksyncv1_goerli";
  BRIDGE_CONTRACT = "0x5c56FC5757259c52747AbB7608F8822e7cE51484";
  CHAIN_ID = 5;
  SECURITY_TYPE = SecurityComp.Nonce;
}
