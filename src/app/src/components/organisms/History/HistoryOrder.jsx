import { OrderSide, OrderType } from "lib/interface";
import { networkSelector, userOrdersSelector } from 'lib/store/features/api/apiSlice';
import { getOrderDetailsWithoutFee, hasOneDayPassed } from "lib/utils";
import React from "react";
import { useSelector } from 'react-redux';

const HistoryOrders = () => {
  const cols = ["Market", "Type", "Time", "Price", "Side", "Volume", "Size", "Status"];
  const userOrders = useSelector(userOrdersSelector);
  const network = useSelector(networkSelector);

  const getOrderHistory = () => {
    let orders = Object.values(userOrders)
      .slice(-25)
      .sort((a, b) => b.id - a.id);
    return orders.filter((order) => {
      return order.status !== "o";
    });
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
        {getOrderHistory().map((order) => {
          const { id, market, side, status, baseQuantity, type } = order;
          const time = order.insertTimestamp;
          const baseCurrency = market.split("-")[0];

          const date = hasOneDayPassed(time);

          const orderWithoutFee = getOrderDetailsWithoutFee(order);
          if (["zksyncv1", "zksyncv1_goerli"].includes(network)) {
            price = orderWithoutFee.price;
            baseQuantity = orderWithoutFee.baseQuantity;
          }

          return (
            <tr key={orderId}>
              <td data-label="Market">{market}</td>
              <td data-label="Order Type">
                {OrderType(type)}
                {/* {orderType === "l" ? "limit" : orderType === "m" ? "market" : "swap"} */}
              </td>
              <td data-label="Time">{date}</td>
              <td data-label="Price">{price.toPrecision(6) / 1}</td>
              <td data-label="Quantity">
                {baseQuantity.toPrecision(6) / 1} {baseCurrency}
              </td>
              <td data-label="Side">
                <OrderSideItem side={side}>{OrderSide[side]}</OrderSideItem>
              </td>
              <td>
                <OrderStatusItem status={orderStatus}>{OrderStatus[status]}</OrderStatusItem>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
export default HistoryOrders;
