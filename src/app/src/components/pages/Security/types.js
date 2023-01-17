import NonceIncrement from "../NonceIncreasement/NonceIncreasement";
import Allowance from "./Allowance";

export const SecurityTypeList = {
  nonce: "nonce",
  allowance: "allowance",
};
export const SecurityCompList = {
  nonce: NonceIncrement,
  allowance: Allowance,
};
