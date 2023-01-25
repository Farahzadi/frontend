import React from "react";
import { styled } from "@mui/system";
import Decimal from "decimal.js";
import { OrderSide, OrderStatus, OrderType } from "lib/interface";
import { getFillDetailsWithoutFee, getOrderDetailsWithoutFee, hasOneDayPassed, isZKSYNCNet } from "lib/utils";
import loadingGif from "assets/icons/loading.svg";
import { TxExplorerLink } from "components/molecules/ExplorerLinks/ExplorerLinks";
import { CancelOrderBtn } from "./OrderHistory.style.module";
import Core from "lib/api/Core";

export const OrderStatusColors = {
  r: "#c4384e",
  m: "rgb(240, 185, 11)",
  f: "#3fe199",
  c: "#b9848d",
  pm: "#3fe199",
};
export const OpenOrderStatusColors = {
  ...OrderStatusColors,
  pm: "rgb(240, 185, 11)",
};
const OrderStatusItem = styled("span")(({ status, theme }) => ({
  color: OrderStatusColors[status],
}));
const OpenOrderStatusItem = styled("span")(({ status, theme }) => ({
  color: OpenOrderStatusColors[status],
}));

const OrderSideItem = styled("span")(({ side, theme }) => ({
  color: side === "b" ? theme.palette.success.main : theme.palette.error.main,
}));
const LoadingGif = styled("img")(() => ({
  width: "30px",
  height: "30px",
}));

const renderLoading = orderStatus => {
  const pendingStats = ["b", "m", "pm"];
  if (pendingStats.includes(orderStatus)) {
    return <LoadingGif className="loading-gif" src={loadingGif} alt="Pending" />;
  }
  return null;
};
const formatTimeInSec = time => {
  const now = (Date.now() / 1000) | 0;
  const offset = time - now;
  const timeInSec = {
    d: 24 * 60 * 60,
    h: 60 * 60,
    m: 60,
    s: 0,
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

const getOrderDetail = (order, network) => {
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
    remaining: remaining + " " + baseCurrency,
    rawRemaining: remaining,
  };
};
const getFillOrderDetail = (fill, network) => {
  if (!fill) return;
  const { isTaker, side } = fill;
  let amount = new Decimal(fill.amount || 0);
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
  amount = amount.toPrecision(6) / 1;
  price = price.toPrecision(6) / 1;

  return {
    price,
    volume: amount + " " + baseCurrency,
    fee: feeText,
  };
};

// common props between orders ( open orders, fill orders, history of orders )
export const OrderPropMap = {
  market: val => val,
  type: val => OrderType[val],
  side: val => <OrderSideItem side={val}>{OrderSide[val]}</OrderSideItem>,
  status: val => <OrderStatusItem status={val}>{OrderStatus[val]}</OrderStatusItem>,
  time: val => hasOneDayPassed(val),
  expiry: (status, expires) => (status !== "f" && status !== "c" ? formatTimeInSec(expires) : "--"),
  detail: getOrderDetail,
  action: ({ status, id }, rawRemaining) => {
    if (status === "o" || (status === "pm" && rawRemaining > 0)) {
      return <CancelOrderBtn onClick={() => Core.run("cancelOrder", id)}>Cancel</CancelOrderBtn>;
    }
  },
};

export const OpenOrderPropMap = {
  ...OrderPropMap,
  status: val => (
    <>
      <OpenOrderStatusItem status={val}>{OrderStatus[val]}</OpenOrderStatusItem>
      {renderLoading(val)}
    </>
  ),
};
export const FillOrdersPropMap = {
  ...OrderPropMap,
  takerSide: order => {
    const { side, takerSide, isTaker } = order;
    const val = side || takerSide || isTaker ? "s" : "b";
    return <OrderSideItem side={val}>{OrderSide[val]}</OrderSideItem>;
  },
  detail: getFillOrderDetail,
  action: order => {
    return <TxExplorerLink txHash={order?.txHash} />;
  },
};

export const mapColsTitleToProp = {
  history: val => {
    if (val === "time") {
      return "createdAt";
    }
    return val;
  },
  orders: val => val,
  fills: val => {
    if (val === "time") {
      return "createdAt";
    } else if (val === "side") {
      return "takerSide";
    }
    return val;
  },
  balances: val => val,
};