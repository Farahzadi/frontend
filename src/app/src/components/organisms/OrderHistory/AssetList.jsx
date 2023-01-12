import { userBalanceByTokenSelector } from "lib/store/features/api/apiSlice";
import React from "react";
import { useSelector } from "react-redux";
import { Tr, Td } from "./OrderHistory.style.module";

export const balancePropMap = {
  token: (val) => getObjKey(val),
  balances: (val) => getObjValue(val)
};
const getObjKey = (val) => val && Object.keys(val)[0];
const getObjValue = (val) => val && Object.values(val)[0];
const AssetList = ({ orders, tabs, selectedTab }) => {
  const balances = useSelector(userBalanceByTokenSelector);
  const cols = ["token", "balances"];
  return (
    <tbody>
      {balances.map((asset) => {
        if (!asset) return null;
        return (
          <Tr key={getObjKey(asset)}>
            {cols.map((col) => (
              <Td key={col}>{balancePropMap[col](asset)}</Td>
            ))}
          </Tr>
        );
      })}
    </tbody>
  );
};
export default AssetList;
