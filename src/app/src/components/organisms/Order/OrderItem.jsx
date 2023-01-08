import { styled } from "@mui/system";
import Decimal from "decimal.js";
import { OrderSide, OrderStatus, OrderType } from "lib/interface";
import {
  getFillDetailsWithoutFee,
  getOrderDetailsWithoutFee,
  hasOneDayPassed,
  isZKSYNCNet
} from "lib/utils";
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
  color: side === "b" ? theme.palette.success.main : theme.palette.error.main
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
      console.log("rounded ", rounded);
      break;
    }
  }
  if (rounded === null) {
    rounded = "--";
  }
  console.log(rounded);
  return rounded;
};
export const OrderPropMap = {
  market: (val) => val,
  type: (val) => OrderType[val],
  side: (val) => <OrderSideItem side={val}>{OrderSide[val]}</OrderSideItem>,
  status: (val) => (
    <>
      <OrderStatusItem status={val}>{OrderStatus[val]}</OrderStatusItem>
      {renderLoading(val)}
    </>
  ),
  time: (val) => hasOneDayPassed(val),
  expires: (status, expires) =>
    status !== "f" && status !== "c" ? formatTimeInSec(expires) : "--",
  orderDetail: (order, network) => {
    if (!order) return;
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
      volume: baseQuantity + " " + baseCurrency,
      remaining: remaining + " " + baseCurrency
    };
  },
  fillDetail: (fill, network) => {
    console.log(fill);
    if (!fill) return;
    const { isTaker, side } = fill;
    let amount = new Decimal(fill.amount || 0);
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
      volume: baseQuantity + " " + baseCurrency,
      fee: feeText
    };
  },
  txHash: (val) =>
    val && (
      <a href={getExplorerLink(network) + val} target="_blank" rel="noreferrer">
        View Tx
      </a>
    ),
  token: (val) => val && Object.keys(val)[0],
  balances: (val) => val && Object.values(val)[0],
  action: (val) => {}
};
