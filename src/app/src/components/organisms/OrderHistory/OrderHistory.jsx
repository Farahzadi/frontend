import {
  TxExplorerLink,
  UserAddressExplorerLink
} from "components/molecules/ExplorerLinks/ExplorerLinks";
import Core from "lib/api/Core";
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
import Tabs from "../Tabs/Tabs";
import { CancelOrderBtn, Header, MainContainer, Table, TableContainer, Td, Th, Thead, Tr } from "./OrderHistory.style.module";

const OrderHistory = () => {
  const [selectedTab, setSelectedTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [orderNum, setOrderNum] = useState({
    open: 0,
    fill: 0,
    history: 0
  });
  const [openModal, setOpenModal] = useState(false);

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
    balances: { name: "assets", id: "balances", cols: ["token", "balances"] }
  };
  const props = Object.keys(OrderPropMap);

  const openOrders = useSelector(userOpenOrdersSelector);
  const userFillOrders = useSelector(userFillOrdersSelector);
  const lastUserOrders = useSelector(getLastOrdersSelector);
  const balances = useSelector(userBalanceByTokenSelector);
  const network = useSelector(networkSelector);
  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);
  useEffect(() => {
    setOrders(openOrders);
  }, [])
  useEffect(() => {
    handleChangeTab(selectedTab);
    setOrderNum({
      open: openOrders?.length,
      fill: userFillOrders?.length,
      history: lastUserOrders?.length
    })
  }, [openOrders, userFillOrders, lastUserOrders, balances]);
  const getOrderDetails = (order) => {
    if (selectedTab === "fills") {
      return OrderPropMap["fillDetail"](order, network);
    } else if (selectedTab === "orders") {
      return OrderPropMap["orderDetail"](order, network);
    }
  };

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
        <td data-label="Action">
          <TxExplorerLink txHash={txHash} />
        </td>
      );
    }
  };
  const handleChangeTab = (val) => {
    setSelectedTab(val);
    switch (val) {
      case "orders":
        setOrders(openOrders);
        break;
      case "fills":
        setOrders(userFillOrders);
        break;
      case "history":
        setOrders(lastUserOrders);
        break;
      case "balances":
        setOrders(balances);
        break;
      default:
        setOrders(openOrders);
        break;
    }
  }
  return (
    <MainContainer>
      {!!orders.length && selectedTab !== "balances" && (
        <CancelOrderBtn  onClick={handleOpen}>
          cancel all order
        </CancelOrderBtn>
      )}
      <Header>
        <Tabs items={tabs}
          ordersNum={orderNum}
         handleSelect={(val) => setSelectedTab(val)} active={selectedTab}></Tabs>
      </Header>
      <TableContainer>

      <Table>
        <Thead>
          <tr>
            {tabs[selectedTab].cols.map((col) => (
              <Th key={col} scope="col">
                {col}
              </Th>
            ))}
          </tr>
        </Thead>
        <tbody>
          {orders.map((order) => {
            if (!order) return null;
            const detail = selectedTab === "fills" || selectedTab === "orders" && getOrderDetails(order);

            return (
              <Tr key={order.id}>
                {tabs[selectedTab].cols.map((col) => {
                  if (props.includes(col)) {
                    return <Td key={col} data-label={col}>{OrderPropMap[col](order?.[col])}</Td>;
                  } else if (col === "expires") {
                    return (
                      <Td key={col} data-label={col}>{OrderPropMap[col](order.status, order.expires)}</Td>
                    );
                  } else {
                    return <Td key={col} data-label={col}>{detail?.[col]}</Td>;
                  }
                })}
                {selectedTab !== "balances" &&renderActionCell(order.status, order.id, order.txHash)}
              </Tr>
            );
          })}
        </tbody>
      </Table>
      </TableContainer>
      {selectedTab === "balances" && <UserAddressExplorerLink />}
    </MainContainer>
  );
};
export default OrderHistory;
