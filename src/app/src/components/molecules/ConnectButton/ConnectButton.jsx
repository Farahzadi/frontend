import { connectionStageSelector } from "lib/store/features/api/apiSlice";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { NetworkStages } from "lib/interface";
import { Button } from "components/atoms/Button";
import Core from "lib/api/Core";
import { connectWallet } from "lib/api/Actions";

const ConnectButton = ({ children }) => {
  const connection = useSelector(connectionStageSelector);
  const [loading, setLoading] = useState(false);
  const handleConnect = () => {
    setLoading(true);
    Core.run(connectWallet).finally(() => setLoading(false));
  };
  if (connection !== NetworkStages.CONNECTED) {
    return (
      <Button loading={loading} className="bg_btn mx-auto" onClick={handleConnect}>
        CONNECT
      </Button>
    );
  } else {
    return children;
  }
};
export default ConnectButton;
