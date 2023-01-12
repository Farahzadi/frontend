import { networkConfigSelector } from "lib/store/features/api/apiSlice";
import React from "react";
import { useSelector } from "react-redux";
import { SecurityCompList, SecurityTypeList } from "./types.js";

const Security = () => {
  const securityType = useSelector(networkConfigSelector)?.securityType;
  const Comp = SecurityCompList[securityType];
  if (Comp) {
    return <Comp />;
  }
  return null;
};

export default Security;
