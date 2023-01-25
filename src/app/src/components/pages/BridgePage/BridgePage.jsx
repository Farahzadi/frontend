import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation, useHistory } from "react-router-dom";
import { networkConfigSelector } from "lib/store/features/api/apiSlice";
import { BridgeTemplate } from "components";
import Bridge from "./Bridge/Bridge";
import "./BridgePage.style.css";

export default function BridgePage() {
  const networkConfig = useSelector(networkConfigSelector);
  const network = networkConfig.name;

  const { hasBridge, hasWrapper } = networkConfig;
  const isBridgeCompatible = useMemo(() => network && hasBridge, [network]);
  const { pathname } = useLocation();
  const history = useHistory();


  return (
    <BridgeTemplate>
      <div className="bridge_section">
        {pathname === "/bridge" ? hasBridge ? <Bridge checkBridge={true} /> : history.push("/") : ""}
        {pathname === "/wrapper" ? hasWrapper ? <Bridge checkWrapper={true} /> : history.push("/") : ""}
      </div>
    </BridgeTemplate>
  );
}
