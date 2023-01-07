import { styled } from "@mui/system";
import { OrderSide, OrderStatus, OrderType } from "lib/interface";
import { hasOneDayPassed, isZKSYNCNet } from "lib/utils";
import React from "react";

const OrderItem = () => {};
export const OrderStatusColors = {
    r: "#c4384e",
    m: "rgb(240, 185, 11)",
    f: "#3fe199"
  };
const OrderStatusItem = styled("span")(({ theme, orderStatus }) => ({
  color: OrderStatusColors[orderStatus]
}));
const OrderSideItem = styled("span")(({ side, theme }) => ({
  color: side === "b" ? theme.palette.success : theme.palette.error
}));
const renderLoading = ({ orderStatus }) => {
  const pendingStats = ["b", "m", "pm"];
  if (pendingStats.includes(orderStatus)) {
    return <img className="loading-gif" src={loadingGif} alt="Pending" />;
  }
  return null;
};
const formatTimeInSec = (time) => {
    const now = (Date.now() / 1000) | 0;
    const offset = time - now;
    const timeInSec = {
      d: 24 * 60 * 60,
      h: 60 * 60,
      m: 60,
      s: 0
    };
    const { day, hour, minute } = timeInSec;
    let rounded = null;
    for (const prop in timeInSec) {
      if (offset > timeInSec[prop]) {
        rounded = Math.floor(offset / timeInSec[prop]) + prop;
        break;
      }
    }
    if (rounded === null) {
      rounded = "--";
    }
    return rounded;
  };
export const OrderPropMap = {
  market: (val) => val,
  type: (val) => OrderType[val],
  side: (val) => <OrderSideItem side={val}>{OrderSide[val]}</OrderSideItem>,
  status: (val) => (
    <>
      <OrderStatusItem status={val}>{OrderStatus[val]}</OrderStatusItem>
      {renderLoading()}
    </>
  ),
  time: (val) => hasOneDayPassed(val),
  expires: (status, expires) =>
    status !== "f" && status !== "c" ? formatTimeInSec(expires) : "--",
  orderDetail: (order, network) => {
    let { price, baseQuantity, remaining } = order;
    const baseCurrency = order.market.split("-")[0];
    if (isZKSYNCNet(network)) {
      const orderZeroFee = getOrderDetailsWithoutFee(order);
      price = orderZeroFee.price;
      baseQuantity = orderZeroFee.baseQuantity;
      remaining = orderZeroFee.remaining;
    }
    price = price.toPrecision(6) / 1;
    baseQuantity = baseQuantity.toPrecision(6) / 1;
    remaining = status === "b" ? ".." : isNaN(Number(remaining)) ? baseQuantity : remaining;

    return {
      price,
      baseQuantity: baseQuantity + " " + baseCurrency,
      remaining: remaining + " " + baseCurrency
    };
  },
  fillDetail: (fill, network) => {
    const { isTaker } = fill;
    let amount = new Decimal(fill.amount);
    let baseQuantity = fill.baseQuantity;
    let price = fill.price;
    const baseCurrency = fill.market.split("-")[0];
    const quoteCurrency = fill.market.split("-")[1];
    const quantity = amount.mul(price);
    let fee = new Decimal(isTaker ? fill.takerFee : fill.makerFee);
    fee = fee.mul(side === "b" ? quantity : amount);

    const feeCurrency = side === "b" ? quoteCurrency : baseCurrency;
    let feeText;
    const fillWithoutFee = getFillDetailsWithoutFee(fill);

    if (isZKSYNCNet(network)) {
      feeText = "0 " + baseCurrency;
      price = fillWithoutFee.price;
      amount = fillWithoutFee.baseQuantity;
    } else {
      feeText = fee.toFixed() + " " + feeCurrency;
    }
    baseQuantity = baseQuantity.toPrecision(6) / 1;
    price = price.toPrecision(6) / 1;

    return {
      price,
      baseQuantity: baseQuantity + " " + baseCurrency,
      fee: feeText
    };
  },
  txHash: (val) =>
    val && (
      <a href={getExplorerLink(network) + val} target="_blank" rel="noreferrer">
        View Tx
      </a>
    ),
  action: (val) => {},
  token: (val) => Object.keys(val)[0],
  balance: (val) => Object.values(val)[0]
};
