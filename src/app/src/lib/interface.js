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
export const activeOrderStatuses = ["o", "m", "b"];

export const OrderType = {
  l: "limit",
  m: "market",
  s: "swap",
};
export const OrderSide = {
  b: "buy",
  s: "sell",
};

export const NetworkStages = {
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
};
export const OrderSideKeyMap = {
  buy: "b",
  sell: "s",
};
export const ZksyncActivationStages = {
  UNKNOWN: "UNKNOWN",
  MUST_DEPOSIT: "MUST_DEPOSIT",
  DEPOSITTING: "DEPOSITTING",
  ACTIVATING: "ACTIVATING",
};

// not used yet
// export const NetStages = {
//   DISCONNECTED: "DISCONNECTED",
//   PROVIDER_CONNECTING: "PROVIDER_CONNECTING",
//   PROVIDER_CONNECTED: "PROVIDER_CONNECTED",
//   SIGNING_IN: "SIGNING_IN",
//   SIGNED_IN: "SIGNED_IN",
//   SIGNING_OUT: "SIGNING_OUT",
//   SIGNED_OUT: "SIGNED_OUT",
//   PROVIDER_DISCONNECTING: "PROVIDER_DISCONNECTING",
// };
