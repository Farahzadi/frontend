import Core from 'lib/api/Core';
import {
  getLastOrdersSelector,
  networkSelector,
  userBalanceByTokenSelector,
  userFillOrdersSelector,
  userOpenOrdersSelector
} from "lib/store/features/api/apiSlice";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { OrderPropMap } from "../Order/OrderItem";

const OrderHistory = () => {
  const [selectedTab, setSelectedTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const tabs = {
    orders: {
      name: "open orders",
      id: "orders",
      cols: ["market", "type", "price", "volume", "remaining", "side", "expiry", "status", "action"]
    },
    fills: {
      name: "trade history",
      id: "fills",
      cols: ["market", "time", "price", "volume", "side", "fee", "status", "action"]
    },
    history: {
      name: "order history",
      id: "history",
      cols: ["market", "type", "time", "price", "side", "volume", "size", "status"]
    },
    balances: { name: "assets", id: "balances", cols: ["token", "balance"] }
  };
  const openOrders = useSelector(userOpenOrdersSelector);
  const userFillOrders = useSelector(userFillOrdersSelector);
  const lastUserOrders = useSelector(getLastOrdersSelector);
  const balances = useSelector(userBalanceByTokenSelector);
  const network = useSelector(networkSelector);
  useEffect(() => {
    switch (selectedTab) {
      case "fills":
        setOrders(userFillOrders);
      case "history":
        setOrders(lastUserOrders);
      case "balances":
        setOrders(balances);
      default:
        setOrders(openOrders);
        break;
    }
  }, [selectedTab]);
  const getOrderDetails = (order) => {
    if (selectedTab === "fills") {
      return OrderPropMap["fillDetail"](order, network);
    } else if (selectedTab === "orders") {
      return OrderPropMap["orderDetail"](order, network);
    }
  };
  const renderExplorerLink = () => (
    <a href={getExplorerUserAddressDetails(network, user.address)} target="_blank" rel="noreferrer">
      View Account on Explorer
    </a>
  );
  const renderActionCell = (status, id, txHash) => {
    if (selectedTab === "orders") {
      return (
        <td data-label="Action">
          {status === "o" ||
            (status === "pm" && remaining > 0 && (
              <span className="cancel_order_link" onClick={() => Core.run("cancelOrder", id)}>
                Cancel
              </span>
            ))}
        </td>
      );
    } else if (selectedTab === "fills" && txHash) {
      return (
        <a href={getExplorerLink(network) + txHash} target="_blank" rel="noreferrer">
          View Tx
        </a>
      );
    }
  };
  return (
    <div>
      <Tabs items={tabs} handleSelect={(val) => setSelectedTab(val)} active={selectedTab}></Tabs>
      <table>
        <thead>
          <tr>
            {tabs[selectedTab].cols.map((col) => (
              <th scope="col">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const detail = getOrderDetails(order);

            return (
              <tr key={order.id}>
                {tabs[selectedTab].cols.map((col) => {
                  const props = Object.keys(OrderPropMap);
                  if (props.includes(col)) {
                    return <td data-label={col}>{OrderPropMap[col](order[col])}</td>;
                  } else {
                    return <td data-label={col}>{detail[col]}</td>;
                  }
                })}
                {renderActionCell(order.status, order.id, order.txHash)}
              </tr>
            );
          })}
        </tbody>
      </table>
      {selectedTab === "balance" && renderExplorerLink()}
    </div>
  );
};
