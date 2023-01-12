import Core from "lib/api/Core";
import { networkSelector } from "lib/store/features/api/apiSlice";
import React from "react";
import { useSelector } from "react-redux";
import { mapColsTitleToProp } from "./Order";
import { Tr, Td, CancelOrderBtn } from "./OrderHistory.style.module";

const OrderList = ({ orders, tabs, selectedTab, mapsFn }) => {
  const network = useSelector(networkSelector);

  const getActionCell = (status, id, remaining, txHash, key) => {
    if (selectedTab === "orders") {
      return (
        (status === "o" || (status === "pm" && remaining > 0)) && (
          <CancelOrderBtn onClick={() => Core.run("cancelOrder", id)}>Cancel</CancelOrderBtn>
        )
      );
    } else if (selectedTab === "fills" && txHash) {
      return <TxExplorerLink txHash={txHash} />;
    }
  };

  return (
    <tbody>
      {orders.map(order => {
        if (!order) return null;
        return (
          <Tr key={order.id}>
            {tabs[selectedTab].cols.map(col => {
              const mapFn = tabs[selectedTab]["map"];
              const colMapFn = tabs[selectedTab]["map"][col];
              const detail = mapFn["detail"](order, network);
              let data;
              if (col === "expiry") {
                data = colMapFn(order.status, order.expires);
              } else if (Object.keys(mapFn).includes(col)) {
                data = colMapFn(order?.[mapColsTitleToProp[selectedTab](col)]);
              } else if (col === "action") {
                data = getActionCell(order.status, order.id, detail?.remaining, order.txHash, col);
              } else {
                data = detail?.[col];
              }
              return (
                <Td key={col} data-label={col}>
                  {data}
                </Td>
              );
            })}
          </Tr>
        );
      })}
    </tbody>
  );
};
export default OrderList;
