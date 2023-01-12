import React, { useState } from "react";
import { useSelector } from "react-redux";
import { networkSelector } from "../../../lib/store/features/api/apiSlice";
import { Button } from "../Button";
import darkPlugHead from "../../../assets/icons/dark-plug-head.png";
import { useHistory, useLocation } from "react-router-dom";
import Core from "lib/api/Core";

const ConnectWalletButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();
  const location = useLocation();

  const pushToBridgeMaybe = state => {
    if (!state.id && !/^\/bridge(\/.*)?/.test(location.pathname)) {
      history.push("/bridge");
    }
  };

  return (
    <Button
      loading={isLoading}
      className="bg_btn"
      text="CONNECT WALLET"
      img={darkPlugHead}
      onClick={() => {
        setIsLoading(true);
        Core.run("connectWallet").finally(() => setIsLoading(false));
      }}
    />
  );
};

export default ConnectWalletButton;
