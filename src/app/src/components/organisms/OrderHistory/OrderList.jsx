import { TxExplorerLink } from "components/molecules/ExplorerLinks/ExplorerLinks";
import Core from "lib/api/Core";
import { networkSelector } from "lib/store/features/api/apiSlice";
import React from "react";
import { useSelector } from "react-redux";
import { mapColsTitleToProp } from "./Order";
import { Tr, Td, CancelOrderBtn } from "./OrderHistory.style.module";

const OrderList = ({ orders, tabs, selectedTab, mapsFn }) => {
  const network = useSelector(networkSelector);

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
              } else if (col === "side" && selectedTab === "fills") {
                data = mapFn["takerSide"](order);
              } else if (col === "action") {
                data = colMapFn(order, detail?.remaining);
              } else if (Object.keys(mapFn).includes(col)) {
                const value = order?.[mapColsTitleToProp[selectedTab](col)];
                data = colMapFn(value);
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
