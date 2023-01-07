import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { SwapButton, Button, useCoinEstimator } from "components";
import {
  networkSelector,
  userChainDetailsSelector,
  userAddressSelector,
  userBalancesSelector,
  networkConfigSelector
} from "lib/store/features/api/apiSlice";
import Loader from "react-loader-spinner";
import ethLogo from "assets/images/currency/ETH.svg";
import cx from "classnames";
import BridgeReceipts from "../BridgeReceipts/BridgeReceipts";
import { BiError } from "react-icons/bi";
import { MdSwapCalls } from "react-icons/md";
import darkPlugHead from "assets/icons/dark-plug-head.png";
import zkLogo from "assets/images/zk.jpg";
import BridgeSwapInput from "../BridgeSwapInput/BridgeSwapInput";
import { networks } from "./utils";
import Currencies from "config/Currencies";
import FeeIcon from "assets/icons/fee.png";
import TimeIcon from "assets/icons/clock.png";

import Core from "lib/api/Core";

const defaultTransfer = {
  type: "deposit"
};

const Bridge = () => {
  const userAddress = useSelector(userAddressSelector);
  const userChainDetails = useSelector(userChainDetailsSelector);
  const userL1Balances = userChainDetails?.L1Balances;
  const userBalances = useSelector(userBalancesSelector);
  const userAllowances = userChainDetails?.allowances;
  const networkConfig = useSelector(networkConfigSelector);
  const [loading, setLoading] = useState(false);
  const [isApproving, setApproving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [bridgeFee, setBridgeFee] = useState(null);
  const [activationFee, setActivationFee] = useState(0);
  const [fromNetwork, setFromNetwork] = useState(networks[0]);
  const [switchClicking, setSwitchClicking] = useState(false);
  const [usdFee, setUsdFee] = useState(0);
  const [toNetwork, setToNetwork] = useState(fromNetwork.to[0]);
  const network = useSelector(networkSelector);
  const [transfer, setTransfer] = useState(defaultTransfer);
  const [coinColor, setCoinColler] = useState(true);
  const [showBridge, setShowBridge] = useState(true);
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const [swapDetails, _setSwapDetails] = useState(() => ({
    amount: "",
    currency: "ETH"
  }));
  const currencies = useMemo(() => null, [transfer.type]);
  const coinEstimator = useCoinEstimator();
  const currencyValue = coinEstimator(swapDetails.currency);
  // const activationFee = parseFloat(
  //   (userAddress && !user.id ? 15 / currencyValue : 0).toFixed(5)
  // );
  const estimatedValue = +swapDetails.amount * coinEstimator(swapDetails.currency) || 0;

  let L1Balances = userL1Balances;
  let L2Balances = userBalances;

  useEffect(() => {
    if (fromNetwork.from.key === "zksync") {
      const type = (transfer.type = "withdraw");
      setTransfer({ type });
    } else {
      Core.run("updateUserBalancesState", true);
      const type = (transfer.type = "deposit");
      setTransfer({ type });
    }

    if (fromNetwork.from.key === "ethereum") {
      Core.run("updateUserBalancesState", true);
      const currency = switchClicking ? swapDetails.currency : "ETH";
      setSwapDetails({ amount: "", currency });
    } else if (fromNetwork.from.key === "zksync" && toNetwork.key === "ethereum") {
      const currency = switchClicking ? swapDetails.currency : "ETH";
      setSwapDetails({ amount: "", currency });
    }
    setSwitchClicking(false);
  }, [toNetwork]);

  useEffect(() => {
    (async () => {
      // update changePubKeyFee fee if needed
      if (userAddress && networkConfig.hasBridge) {
        // TODO
        const usdFee = await Core.run("changePubKeyFee");
        setUsdFee(usdFee);
        if (Number.isFinite(usdFee / currencyValue)) {
          if (currencyValue) {
            setActivationFee((usdFee / currencyValue).toFixed(5));
          } else {
            setActivationFee(0);
          }
        } else {
          setActivationFee(0);
        }
      }
    })();
  }, [fromNetwork, toNetwork, swapDetails.currency, userAddress]);
  useEffect(() => {
    function handleWindowResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);
  const setSwapDetails = (values) => {
    const details = {
      ...swapDetails,
      ...values
    };

    _setSwapDetails(details);

    const setFee = (bridgeFee) => {
      setBridgeFee(bridgeFee);

      const bals = transfer.type === "deposit" ? L1Balances : L2Balances;
      const detailBalance = Number(bals?.[details.currency]?.valueReadable ?? 0);
      const input = Number(details.amount || 0);
      if (input > 0) {
        if (input < 0.001) {
          setFormErr("Must be at least 0.001");
        } else if (input <= activationFee) {
          setFormErr(`Must be more than ${activationFee} ${swapDetails.currency}`);
        } else if (input > detailBalance - Number(bridgeFee)) {
          setFormErr("Insufficient balance");
        } else {
          setFormErr("");
        }
      } else {
        setFormErr("");
      }
    };

    if (userAddress && transfer.type === "withdraw") {
      setFee(null);
      Core.run("withdrawL2Fee", details.currency)
        .then((fee) => setFee(fee))
        .catch((err) => {
          console.log(err);
          setFee(null);
        });
    } else {
      setFee(0);
    }
  };

  const switchTransferType = (e) => {
    const f = networks.find((i) => i.from.key === toNetwork.key);
    setFromNetwork(f);
    setToNetwork(fromNetwork.from);
    setSwitchClicking(true);
    setCoinColler(!coinColor);
  };

  const disconnect = () => {
    Core.run("disconnectWallet").catch((err) => console.log(err));
  };

  const ethLayer1Header = (
    <div className="bridge_coin_details ">
      <p className="">Ethereum L1</p>
    </div>
  );
  const ethLayer1HeaderDetails = (
    <div className="bridge_coin_details">
      <p>Ethereum L1</p>
    </div>
  );

  const zkSyncLayer2Header = (
    <div className="bridge_coin_details ">
      <p className={` `}>zkSync(V1) L2</p>
    </div>
  );
  const zkSyncLayer2HeaderDetails = (
    <div className="bridge_coin_details mx-auto">
      <p>zkSync(V1) L2</p>
    </div>
  );

  const balances = transfer.type === "deposit" ? L1Balances : L2Balances;
  const altBalances = transfer.type === "deposit" ? L2Balances : L1Balances;
  const hasAllowance = true; // TODO: make chain specific!
  // new Decimal(userAllowances?.[swapDetails.currency]?.value || 0).greaterThan(
  //   maxAllowance.div(3).toString()
  // );
  const hasError = formErr && formErr.length > 0;

  const approveSpend = (e) => {
    if (e) e.preventDefault();
    setApproving(true);
    Core.run("approveL1", swapDetails.currency)
      .then(() => {
        setApproving(false);
      })
      .catch((err) => {
        console.log(err);
        setApproving(false);
      });
  };

  const doTransfer = async (e) => {
    e.preventDefault();

    setLoading(true);

    if (transfer.type === "deposit")
      await Core.run("depositL2", swapDetails.amount, swapDetails.currency);
    else await Core.run("withdrawL2", swapDetails.amount, swapDetails.currency);

    setLoading(false);
  };
  function getWindowSize() {
    const { innerWidth, innerHeight } = window;
    return { innerWidth, innerHeight };
  }
  const availableBalanceOnSelectedSide = (
    <>
      <div className=" bridge_coin_title align-self-end">
        <p className="bridge_bottom_form__right-title">Available balance</p>
        <p>
          {balances?.[swapDetails.currency]?.valueReadable}
          {` ${swapDetails.currency}`}
        </p>
      </div>
    </>
  );

  return (
    <>
      <div className="bridge_lables-btn">
        <button
          onClick={() => setShowBridge(true)}
          className={showBridge ? "bridge_lables-btn__active" : ""}>
          BRIDGE
        </button>
        <button
          onClick={() => setShowBridge(false)}
          className={!showBridge ? "bridge_lables-btn__active" : ""}>
          recepits
        </button>
      </div>
      <div
        className={`bridge_container ${
          showBridge || "960" <= windowSize.innerWidth ? "d-flex" : "d-none"
        }`}>
        <div className="bridge_box_parent ">
          <div className="bridge_box">
            <div className="bridge_box_top">
              <div className="center-form">
                <BridgeSwapInput
                  bridgeFee={bridgeFee}
                  balances={balances}
                  currencies={currencies}
                  value={swapDetails}
                  availableBalanceOnSelectedSide={availableBalanceOnSelectedSide}
                  onChange={setSwapDetails}>
                  <div className="bridge_coin_title">
                    <p>FROM</p>
                    {transfer.type === "withdraw" ? zkSyncLayer2Header : ethLayer1Header}
                  </div>
                </BridgeSwapInput>
              </div>
            </div>

            <div className="bridge_box_bottom">
              <div className="bridge_box_swap_wrapper">
                <SwapButton onClick={switchTransferType} />
              </div>
              <div className="center-form">
                <div className="bridge_bottom_form">
                  <div className="bridge_coin_stat">
                    <div className="bridge_coin_top">
                      <div className="bridge_coin_title">
                        <p>TO</p>
                        {transfer.type !== "withdraw" ? zkSyncLayer2Header : ethLayer1Header}
                      </div>
                    </div>
                    <div className="currencyName-box">
                      <div className="currencyName-selected">
                        <div className="bridge_coin_image" style={{ background: "#fff" }}>
                          <img
                            alt="Ethereum logo"
                            src={Currencies[swapDetails.currency.toString()].image.default}
                          />
                        </div>
                        <div className="currencyName">{swapDetails.currency}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bridge_bottom_form__right">
                    <div className=" bridge_coin_title align-self-end">
                      <p className="bridge_bottom_form__right-title">Available balance</p>
                      <p>
                        {altBalances?.[swapDetails.currency]?.valueReadable.toString()}
                        {` ${swapDetails.currency}`}
                      </p>
                    </div>
                    <div className="bridge_coin_details bridge_coin_details_border ">
                      {/* <div className={` ${coinColor ? "" : "zkS-name"}`}> */}
                      <h4>
                        {/* You'll receive:                          */}~
                        {Number(swapDetails.amount).toPrecision(4)}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bridg-btn-box">
              <div className="transfer-data">
                <div>
                  <img src={TimeIcon} />
                  0:0
                </div>
                <div>
                  <img src={FeeIcon} alt="" />
                  <b className="mx-0">
                    {transfer.type === "withdraw" ? null : "~"}
                    {typeof bridgeFee !== "number" ? (
                      <div style={{ display: "inline-flex", margin: "0 5px" }}>
                        <Loader type="TailSpin" color="#444" height={16} width={16} />
                      </div>
                    ) : (
                      <div className="fee_container">
                        {transfer.type === "withdraw" ? bridgeFee : "0.000105"}
                      </div>
                    )}
                    {transfer.type === "withdraw" ? swapDetails.currency : "ETH"}
                  </b>
                </div>
              </div>
              <div className="accept-btn">
                <button onClick={() => setShowModal(true)}> ACCEPT</button>
              </div>
            </div>
          </div>
          <div className={`receiptsBox ${windowSize.innerWidth <= "960" ? "d-none" : ""}`}>
            <BridgeReceipts />
          </div>
        </div>
      </div>
      <div
        className={`${!showBridge ? "d-block" : "d-none"} ${
          windowSize.innerWidth >= "960" ? "d-none" : ""
        } `}>
        <BridgeReceipts ReceiptsHeight="true" />
      </div>
    </>
  );
};

export default Bridge;
