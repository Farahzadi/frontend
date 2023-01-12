import { networkConfigSelector } from "lib/store/features/api/apiSlice";
import React from "react";
import { useSelector } from "react-redux";
import { SecurityComp } from "./types.js";

const Security = () => {
  const securityType = useSelector(networkConfigSelector)?.securityType;
  const Comp = SecurityComp[securityType];
  return <Comp />;
};

export default Security;
