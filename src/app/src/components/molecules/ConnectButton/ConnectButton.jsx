import { connectionStageSelector } from "lib/store/features/api/apiSlice";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { NetworkStages } from "lib/interface";
import { Button } from "components/atoms/Button";
import darkPlugHead from "assets/icons/dark-plug-head.png";
import Core from "lib/api/Core";
import { connectWallet } from "lib/api/Actions";

const ConnectButton = ({ children, hasIcon, text }) => {
  const connection = useSelector(connectionStageSelector);
  const isConnected = connection === NetworkStages.CONNECTED;
  const isConnecting = connection === NetworkStages.CONNECTING;
  const handleConnect = () => {
    Core.run(connectWallet);
  };
  if (!isConnected) {
    return (
      <Button
        loading={isConnecting}
        className="bg_btn"
        onClick={handleConnect}
        img={hasIcon ? darkPlugHead : undefined}
        style={{ width: "auto" }}>
        {text ?? "CONNECT"}
      </Button>
    );
  } else {
    return children;
  }
};
export default ConnectButton;
