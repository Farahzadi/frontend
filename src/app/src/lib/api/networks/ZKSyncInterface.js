import Decimal from "decimal.js";
import { createIcon } from "@download/blockies";

import { getENSName } from "lib/ens";
import { formatAmount } from "lib/utils";
import erc20ContractABI from "lib/contracts/ERC20.json";
import { maxAllowance } from "../constants";
import axios from "axios";
import { toast } from "react-toastify";
import ZKSyncAPIProvider from "../providers/ZKSyncAPIProvider";
import NetworkInterface from "./NetworkInterface";

export default class ZKSyncInterface extends NetworkInterface {
  static Provider = ZKSyncAPIProvider;
  NETWORK = "zksyncv1";
  HAS_BRIDGE = true;
  BRIDGE_CONTRACT = "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF";

  // connectWallet = async () => {
  // };
}
