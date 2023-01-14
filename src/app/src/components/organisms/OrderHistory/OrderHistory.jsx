import { TxExplorerLink, UserAddressExplorerLink } from "components/molecules/ExplorerLinks/ExplorerLinks";
import Core from "lib/api/Core";
import {
  getLastOrdersSelector,
  networkSelector,
  userBalanceByTokenSelector,
  userFillOrdersSelector,
  userOpenOrdersSelector,
} from "lib/store/features/api/apiSlice";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { BalancePropMap, FillOrdersPropMap, mapColsTitleToProp, OpenOrderPropMap, OrderPropMap } from "./Order";
import Tabs from "../Tabs/Tabs";
import {
  ActionBar,
  ActionBtn,
  CancelAllOrderBtn,
  CancelOrderBtn,
  InnerTh,
  MainContainer,
  Table,
  TableContainer,
  Td,
  Th,
  Thead,
  Tr,
} from "./OrderHistory.style.module";
import OrderList from "./OrderList";
import AssetList from "./AssetList";
import { Modal } from "components/atoms/Modal";

const OrderHistory = () => {
  const [selectedTab, setSelectedTab] = useState("orders");
  const [orderNum, setOrderNum] = useState({
    open: 0,
    fill: 0,
    history: 0,
  });
  const [openModal, setOpenModal] = useState(false);

  const tabs = {
    orders: {
      name: "open orders",
      id: "orders",
      cols: ["market", "type", "price", "volume", "remaining", "side", "expiry", "status", "action"],
      map: OpenOrderPropMap,
    },
    fills: {
      name: "trade history",
      id: "fills",
      cols: ["market", "time", "price", "volume", "side", "fee", "status", "action"],
      map: FillOrdersPropMap,
    },
    history: {
      name: "order history",
      id: "history",
      cols: ["market", "type", "time", "price", "volume", "side", "status"],
      map: OpenOrderPropMap,
    },
    balances: { name: "assets", id: "balances", cols: ["token", "balances"] },
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
    setOrderNum({
      orders: openOrders?.length,
      fills: userFillOrders?.length,
      history: lastUserOrders?.length,
    });
  }, [openOrders, userFillOrders, lastUserOrders, balances]);
  const handleCancelAll = async () => {
    const accept = await Modal.accept({
      proceedText: "Yes",
      cancelText: "No",
      alert: "Are you sure you want to delete all orders?",
    });
    if (accept) Core.run("cancelAllOrders");
  };
  const getOrderDetails = order => {
    return tabs[selectedTab]["map"]["detail"](order, network);
  };
  const renderRelatedOrderList = useMemo(() => {
    let orders;
    switch (selectedTab) {
    case "fills":
      orders = userFillOrders;
      break;
    case "history":
      orders = lastUserOrders;
      break;
    case "balances":
      orders = balances;
      return <AssetList orders={balances} tabs={tabs} selectedTab={selectedTab} />;
    default:
      orders = openOrders;
      break;
    }
    return <OrderList orders={orders} tabs={tabs} selectedTab={selectedTab} />;
  }, [selectedTab, openOrders, userFillOrders, lastUserOrders, balances]);
  return (
    <MainContainer>
      <Tabs items={tabs} ordersNum={orderNum} handleSelect={val => setSelectedTab(val)} selected={selectedTab}></Tabs>
      {openOrders.length > 1 && selectedTab === "orders" && (
        <ActionBar>
          <ActionBtn onClick={handleCancelAll}>cancel all order</ActionBtn>
        </ActionBar>
      )}
      <TableContainer hasAction={openOrders.length > 1 && selectedTab === "orders"}>
        <Table>
          <Thead>
            <tr>
              {tabs[selectedTab].cols.map(col => (
                <Th key={col} scope="col">
                  <InnerTh>{col}</InnerTh>
                </Th>
              ))}
            </tr>
          </Thead>
          {renderRelatedOrderList}
        </Table>
      </TableContainer>
      {selectedTab === "balances" && <UserAddressExplorerLink />}
    </MainContainer>
  );
};
export default memo(OrderHistory);
