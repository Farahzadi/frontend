import { styled } from "@mui/material";
import { OrderSide, OrderStatus, OrderType } from "lib/interface";
import { networkSelector, userOrdersSelector } from "lib/store/features/api/apiSlice";
import React from "react";
import { useSelector } from "react-redux";

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
const OpenOrders = () => {
  const cols = [
    "Market",
    "Type",
    "Price",
    "Volume",
    "Remaining",
    "Side",
    "Expiry",
    "Status",
    "Action"
  ];
  const userOrders = useSelector(userOrdersSelector);
  const network = useSelector(networkSelector);

  const getUserOrders = () => {
    let orders = Object.values(userOrders).sort((a, b) => b.id - a.id);
    return orders.filter((order) => {
      return !activeOrderStatus.includes(order.status) && order.market === currentMarket;
    });
  };
  const getOpenOrders = () => {
    let orders = getUserOrders();
    return orders.filter((order) => {
      return order.status === "o";
    });
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
  const renderLoading = ({ orderStatus }) => {
    const pendingStats = ["b", "m", "pm"];
    if (pendingStats.includes(orderStatus)) {
      return <img className="loading-gif" src={loadingGif} alt="Pending" />;
    }
    return null;
  };
  return (
    <table>
      <thead>
        <tr>
          {cols.map((col) => (
            <th scope="col">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {getOpenOrders().map((order, i) => {
          const { id, market, type, expires, price, status, side } = order;
          let baseQuantity = order.baseQuantity;
          let remaining = isNaN(Number(order.remaining)) ? order.baseQuantity : order.remaining;
          const baseCurrency = order.market.split("-")[0];
          const orderWithoutFee = getOrderDetailsWithoutFee(order);
          if (["zksyncv1", "zksyncv1_goerli"].includes(network)) {
            price = orderWithoutFee.price;
            baseQuantity = orderWithoutFee.baseQuantity;
            remaining = orderWithoutFee.remaining;
          }
          return (
            <tr key={id}>
              <td data-label="Market">{market}</td>
              <td data-label="Order Type">{OrderType[type]}</td>
              <td data-label="Price">{price.toPrecision(6) / 1}</td>
              <td data-label="Quantity">
                {baseQuantity.toPrecision(6) / 1} {baseCurrency}
              </td>
              <td data-label="Remaining">
                {status === "b" ? ".." : remaining.toPrecision(6) / 1}
                {baseCurrency}
              </td>

              <td data-label="Side">
                <OrderSideItem side={side}>{OrderSide[side]}</OrderSideItem>
              </td>
              <td data-label="Expiry">
                {status !== "f" && status !== "c" ? formatTimeInSec(expires) : "--"}
              </td>
              <td data-label="Order Status">
                {unbroadcasted !== baseQuantity && (
                  <OrderStatusItem status={orderStatus}>{OrderStatus[status]}</OrderStatusItem>
                )}
                {renderLoading()}
              </td>

              <td data-label="Action">
                {status === "o" ||
                  (status === "pm" && remaining > 0 && (
                    <span
                      className="cancel_order_link"
                      onClick={() => Core.run("cancelOrder", orderId)}>
                      Cancel
                    </span>
                  ))}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default OpenOrders;
