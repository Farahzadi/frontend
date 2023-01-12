export const OrderStatus = {
  o: "open",
  b: "committing",
  r: "rejected",
  pf: "partial fill",
  f: "filled",
  pm: "partial matched",
  m: "matched",
  c: "canceled",
  e: "expired",
};
export const fillStatusList = ["m", "b", "f", "r", "e"];
export const openOrderStatusList = ["c", "r", "e", "f"];
export const liveOrderStatusList = ["e", "r", "c"];
export const OrderType = {
  l: "limit",
  m: "market",
  s: "swap",
};
export const OrderSide = {
  b: "buy",
  s: "sell",
};