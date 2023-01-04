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
}
export const activeFillStatus = ["m", "b", "f", "r", "e"];
export const activeOrderStatus = ["c", "r", "e", "f"];
export const OrderType = {
    l: "limit",
    m: "market",
    s: "swap"
}
export const OrderSide = {
    b: "buy",
    s: "sell"
}