import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { SwapButton, Button, useCoinEstimator } from "components";
import {
  networkSelector,
  userChainDetailsSelector,
  userAddressSelector,
  userBalancesSelector,
  networkConfigSelector,
} from "lib/store/features/api/apiSlice";
import Loader from "react-loader-spinner";
import ethLogo from "assets/images/currency/ETH.svg";
import { maxAllowance } from "lib/api/constants";
import { formatUSD } from "lib/utils";
import cx from "classnames";
import BridgeReceipts from "../BridgeReceipts/BridgeReceipts";
import { BiError } from "react-icons/bi";
import { MdSwapCalls } from "react-icons/md";
import darkPlugHead from "assets/icons/dark-plug-head.png";
import zkLogo from "assets/images/zk.jpg";
import BridgeSwapInput from "../BridgeSwapInput/BridgeSwapInput";
import { networks } from "./utils";
import { Modal } from "components/atoms/Modal";
import Currencies from "config/Currencies";
import Decimal from "decimal.js";
import Core from "lib/api/Core";

const defaultTransfer = {
  type: "deposit",
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
  const [showModal, setShowModal] = useState(false);
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const [swapDetails, _setSwapDetails] = useState(() => ({
    amount: "",
    currency: "ETH",
  }));
  const currencies = useMemo(() => null, [transfer.type]);
  const coinEstimator = useCoinEstimator();
  const currencyValue = coinEstimator(swapDetails.currency);
  // const activationFee = parseFloat(
  //   (userAddress && !user.id ? 15 / currencyValue : 0).toFixed(5)
  // );
  const estimatedValue =
    +swapDetails.amount * coinEstimator(swapDetails.currency) || 0;

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
    } else if (
      fromNetwork.from.key === "zksync" &&
      toNetwork.key === "ethereum"
    ) {
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
      ...values,
    };

    _setSwapDetails(details);

    const setFee = (bridgeFee) => {
      setBridgeFee(bridgeFee);

      const bals = transfer.type === "deposit" ? L1Balances : L2Balances;
      const detailBalance = Number(
        bals?.[details.currency]?.valueReadable ?? 0
      );
      const input = Number(details.amount || 0);
      if (input > 0) {
        if (input < 0.001) {
          setFormErr("Must be at least 0.001");
        } else if (input <= activationFee) {
          setFormErr(
            `Must be more than ${activationFee} ${swapDetails.currency}`
          );
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
    <div className="bridge_coin_details bridge_coin_details_border">
      <div className="bridge_coin_image" style={{ background: "#fff" }}>
        <img alt="Ethereum logo" src={ethLogo} />
      </div>
      <div className="bridge_coin_name">Ethereum L1</div>
    </div>
  );
  const ethLayer1HeaderDetails = (
    <div className="bridge_coin_details">
      <div>Ethereum L1</div>
    </div>
  );

  const zkSyncLayer2Header = (
    <div className="bridge_coin_details bridge_coin_details_border">
      <div className="bridge_coin_image">
        <img alt="zkLogo" src={zkLogo} />
      </div>
      <div className={`bridge_coin_name `}>zkSync(V1) L2</div>
    </div>
  );
  const zkSyncLayer2HeaderDetails = (
    <div className="bridge_coin_details mx-auto">
      <div>zkSync(V1) L2</div>
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
        setShowModal(false);
        setApproving(false);
      })
      .catch((err) => {
        console.log(err);
        setShowModal(false);
        setApproving(false);
      })
      .finally(() => {
        setShowModal(false);
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

  return (
    <>
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <div className="bridge_box_right_content container">
          <div className="row">
            <div className="col-6-border">
              <p>
                <small>Source Network :</small>
              </p>
              <p>
                <b>
                  {transfer.type !== "withdraw"
                    ? ethLayer1HeaderDetails
                    : zkSyncLayer2HeaderDetails}
                </b>
                <i class="fa-solid fa-arrow-right"></i>
              </p>
            </div>
            <div className="col-5-border mb-2">
              <p>
                <small>Destination Network:</small>
              </p>
              <p>
                <b>
                  {transfer.type === "withdraw"
                    ? ethLayer1HeaderDetails
                    : zkSyncLayer2HeaderDetails}
                </b>
              </p>
            </div>
            <hr />
            <div className="col-6-border">
              <p>
                <small>Source coin:</small>
              </p>
              <p>
                <b>{swapDetails.currency}</b>
                <i class="fa-solid fa-arrow-right" />
              </p>
            </div>
            <div className="col-5-border mb-2">
              <p>
                <small> Destination coin:</small>
              </p>
              <p>
                <b>{swapDetails.currency}</b>
              </p>
            </div>
            <hr />
            <div className="col-6-border-right-dark d-flex align-items-center my-2">
              <p className="bridge_box_fee">
                Fee:
                <b className="mx-0">
                  {transfer.type === "withdraw" ? null : "~"}
                  {typeof bridgeFee !== "number" ? (
                    <div style={{ display: "inline-flex", margin: "0 5px" }}>
                      <Loader
                        type="TailSpin"
                        color="#444"
                        height={16}
                        width={16}
                      />
                    </div>
                  ) : (
                    <div className="fee_container">
                      {transfer.type === "withdraw" ? bridgeFee : "0.000105"}
                    </div>
                  )}
                  {transfer.type === "withdraw" ? swapDetails.currency : "ETH"}
                </b>
              </p>
            </div>
            <div className="col-5-border my-2 d-flex align-items-center justify-content-end">
              <p>
                Time: <b className="mx-0">2 to 10 min</b>
              </p>
            </div>
          </div>
          <div className="bridge_button">
            {!userAddress && (
              <Button
                className="bg_btn bg_btn-transfer"
                text="CONNECT WALLET"
                img={darkPlugHead}
                onClick={() => Core.run("connectWallet")}
              />
            )}
            {userAddress && balances?.[swapDetails.currency] && !hasAllowance && (
              <Button
                loading={isApproving}
                className={cx("bg_btn bg_btn-transfer", {
                  zig_disabled:
                    formErr.length > 0 || swapDetails.amount.length === 0,
                })}
                text="APPROVE"
                style={{ marginBottom: 10 }}
                onClick={approveSpend}
              />
            )}
            {userAddress && hasError && (
              <Button
                className="bg_btn bg_btn-transfer zig_btn_disabled bg_err"
                text={formErr}
                icon={<BiError />}
              />
            )}
            {userAddress && !hasError && (
              <Button
                loading={loading}
                className={cx("bg_btn bg_btn-transfer", {
                  zig_disabled:
                    bridgeFee === null ||
                    !hasAllowance ||
                    swapDetails.amount.length === 0,
                })}
                text="TRANSFER"
                icon={<MdSwapCalls />}
                onClick={doTransfer}
              />
            )}
          </div>
          <div>
            {userAddress ? (
              <div className="bridge_connected_as">
                {/* <span className="bridge_bubble_connected" />
                <p className="small">
                  Connected as
                  {`${userAddress.substr(0, 6)}...${userAddress.substr(-5)}`}
                </p> */}
                <span onClick={disconnect} className="bridge_disconnect">
                  {" • "}
                  <a href="#disconnect">Disconnect</a>
                </span>
              </div>
            ) : (
              <div className="bridge_connected_as">
                <span className="bridge_bubble_disconnected" />
                Disconnected
              </div>
            )}
          </div>
          {transfer.type === "deposit" &&
            userAddress &&
            !userChainDetails?.userId && (
              <div className="bridge_transfer_fee">
                <div>
                  One-Time Activation Fee: {activationFee}{" "}
                  {swapDetails.currency} (~${usdFee})
                </div>
                You'll receive: ~{Number(swapDetails.amount).toPrecision(4)}
                {" " + swapDetails.currency} on L2
              </div>
            )}

          {userAddress ? (
            userChainDetails?.userId && (
              <div className="bridge_transfer_fee">
                <div>
                  {transfer.type === "withdraw" ? (
                    <div>
                      <div>
                        You'll receive: ~
                        {bridgeFee && swapDetails.amount > 0
                          ? Number(swapDetails.amount - bridgeFee).toPrecision(
                              4
                            )
                          : Number(swapDetails.amount).toPrecision(4)}
                        {" " + swapDetails.currency} on L1
                      </div>
                    </div>
                  ) : (
                    <div>
                      You'll receive: ~
                      {Number(swapDetails.amount).toPrecision(4)}
                      {" " + swapDetails.currency} on L2
                    </div>
                  )}
                </div>
                {/* {transfer.type === "withdraw" ? "Bridge Fee:" : "Bridge Fee: ~"} */}
                {/* {typeof bridgeFee !== "number" ? (
                  <div style={{ display: "inline-flex", margin: "0 5px" }}>
                    <Loader
                      type="TailSpin"
                      color="#444"
                      height={16}
                      width={16}
                    />
                  </div>
                ) : (
                  <div className="fee_container">
                    {transfer.type === "withdraw" ? bridgeFee : "0.000105"}
                  </div>
                )} */}
                {/* {transfer.type === "withdraw" ? swapDetails.currency : "ETH"} */}
              </div>
            )
          ) : (
            <div className="bridge_transfer_fee">
              🔗 &nbsp;Please connect your wallet
            </div>
          )}
        </div>
      </Modal>
      <div className="bridge_lables-btn">
        <button
          onClick={() => setShowBridge(true)}
          className={showBridge ? "bridge_lables-btn__active" : ""}
        >
          BRIDGE
        </button>
        <button
          onClick={() => setShowBridge(false)}
          className={!showBridge ? "bridge_lables-btn__active" : ""}
        >
          recepits
        </button>
      </div>
      <div
        className={`bridge_container ${
          showBridge || "960" <= windowSize.innerWidth ? "d-flex" : "d-none"
        }`}
      >
        <div className="bridge_lables">
          <h5>BRIDGE</h5>
        </div>
        <div className="bridge_box_parent ">
          <div className="bridge_box">
            <div className="bridge_box_top">
              <div className="center-form">
                <div className="bridge_coin_title">
                  <h5>FROM</h5>
                  {transfer.type === "withdraw"
                    ? zkSyncLayer2Header
                    : ethLayer1Header}
                </div>
                <BridgeSwapInput
                  bridgeFee={bridgeFee}
                  balances={balances}
                  currencies={currencies}
                  value={swapDetails}
                  onChange={setSwapDetails}
                />
                <div className="bridge_coin_stats">
                  <div className="bridge_coin_stat">
                    <h5>Estimated value</h5>
                    <span>~${formatUSD(estimatedValue)}</span>
                  </div>
                  <div className="bridge_coin_stat">
                    <h5>Available balance</h5>
                    <span>
                      {balances?.[swapDetails.currency]?.valueReadable}
                      {` ${swapDetails.currency}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bridge_box_bottom">
              <div className="bridge_box_swap_wrapper">
                <SwapButton onClick={switchTransferType} />
              </div>
              <div className="center-form">
                <div className="bridge_coin_stat">
                  <div className="bridge_coin_top">
                    <div className="bridge_coin_title">
                      <h5>TO</h5>
                      {transfer.type !== "withdraw"
                        ? zkSyncLayer2Header
                        : ethLayer1Header}
                    </div>
                  </div>
                </div>
                <h5 className="mt-0 mt-md-5 mb-2">Destination coin</h5>

                <div className="bridge_coin_details bridge_coin_details_border ">
                  <div
                    className="bridge_coin_image"
                    style={{ background: "#fff" }}
                  >
                    <img
                      alt="Ethereum logo"
                      src={
                        Currencies[swapDetails.currency.toString()].image
                          .default
                      }
                    />
                  </div>
                  <div className="bridge_coin_name">
                    {/* <div className={`bridge_coin_name ${coinColor ? "" : "zkS-name"}`}> */}
                    {swapDetails.currency}
                  </div>
                </div>
                <div className="bridge_coin_stats">
                  <div className=" bridge_coin_stat text-start mt-3">
                    <h5>Available balance</h5>
                    <span>
                      {altBalances?.[
                        swapDetails.currency
                      ]?.valueReadable.toString()}
                      {` ${swapDetails.currency}`}
                    </span>
                  </div>
                </div>

                <div className="accept-btn">
                  <button onClick={() => setShowModal(true)}> ACCEPT</button>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`w-100 ${
              windowSize.innerWidth <= "960" ? "d-none" : ""
            }`}
          >
            <div className="bridge_lables">
              <h5>RECEIPTS</h5>
            </div>
            <BridgeReceipts className="w-100" />
          </div>
        </div>

        <div className="bridge_box_right">
          <div className="bridge_box_right_content bright-bg">
            <div className="row">
              <div className="col-6-border">
                <p>
                  <small>Source Network :</small>
                </p>
                <p>
                  <b className="text-dark">
                    {transfer.type !== "withdraw"
                      ? ethLayer1HeaderDetails
                      : zkSyncLayer2HeaderDetails}
                  </b>
                  <i class="fa-solid fa-arrow-right"></i>
                </p>
              </div>
              <div className="col-5-border mb-2">
                <p>
                  <small>Destination Network:</small>
                </p>
                <p>
                  <b className="text-dark">
                    {transfer.type === "withdraw"
                      ? ethLayer1HeaderDetails
                      : zkSyncLayer2HeaderDetails}
                  </b>
                </p>
              </div>
              <hr />
              <div className="col-6-border">
                <p>
                  <small>Source coin:</small>
                </p>
                <p>
                  <b className="text-dark">{swapDetails.currency}</b>
                  <i class="fa-solid fa-arrow-right" />
                </p>
              </div>
              <div className="col-5-border mb-2">
                <p>
                  <small> Destination coin:</small>
                </p>
                <p>
                  <b className="text-dark">{swapDetails.currency}</b>
                </p>
              </div>
              <hr />
              <div className="col-6-border-right-dark d-flex align-items-center">
                <p className="bridge_box_fee">
                  Fee:
                  <b className="mx-0">
                    {transfer.type === "withdraw" ? null : "~"}
                    {""}
                    {typeof bridgeFee !== "number" ? (
                      <div style={{ display: "inline-flex", margin: "0 5px" }}>
                        <Loader
                          type="TailSpin"
                          color="#444"
                          height={16}
                          width={16}
                        />
                      </div>
                    ) : (
                      <div className="fee_container">
                        {transfer.type === "withdraw" ? bridgeFee : "0.000105"}
                      </div>
                    )}
                    {transfer.type === "withdraw"
                      ? swapDetails.currency
                      : "ETH"}
                  </b>
                </p>
              </div>
              <div className="col-5-border-time d-flex align-items-center justify-content-end">
                <p>
                  Time: <b className="mx-0">2 to 10 min</b>
                </p>
              </div>
            </div>
            <div className="bridge_button">
              {!userAddress && (
                <Button
                  className="bg_btn bg_btn-transfer"
                  text="CONNECT WALLET"
                  img={darkPlugHead}
                  onClick={() => Core.run("connectWallet")}
                />
              )}
              {userAddress &&
                balances?.[swapDetails.currency] &&
                !hasAllowance && (
                  <Button
                    loading={isApproving}
                    className={cx("bg_btn bg_btn-transfer", {
                      zig_disabled:
                        formErr.length > 0 || swapDetails.amount.length === 0,
                    })}
                    text="APPROVE"
                    style={{ marginBottom: 10 }}
                    onClick={approveSpend}
                  />
                )}
              {userAddress && hasError && (
                <Button
                  className="bg_btn bg_btn-transfer zig_btn_disabled bg_err"
                  text={formErr}
                  icon={<BiError />}
                />
              )}
              {userAddress && !hasError && (
                <Button
                  loading={loading}
                  className={cx("bg_btn bg_btn-transfer", {
                    zig_disabled:
                      bridgeFee === null ||
                      !hasAllowance ||
                      swapDetails.amount.length === 0,
                  })}
                  text="TRANSFER"
                  icon={<MdSwapCalls />}
                  onClick={doTransfer}
                />
              )}
            </div>
            <div>
              {userAddress ? (
                <div className="bridge_connected_as text-black">
                  {/* <span className="bridge_bubble_connected" /> <p className="small mb-0">Connected as
                  {`${userAddress.substr(0, 6)}...${userAddress.substr(-5)}`}</p> */}
                  <span onClick={disconnect} className="bridge_disconnect">
                    {" • "}
                    <a href="#disconnect">Disconnect</a>
                  </span>
                </div>
              ) : (
                <div className="bridge_connected_as text-black">
                  <span className="bridge_bubble_disconnected" />
                  Disconnected
                </div>
              )}
            </div>
            {transfer.type === "deposit" &&
              userAddress &&
              !userChainDetails?.userId && (
                <div className="bridge_transfer_fee">
                  <div>
                    One-Time Activation Fee: {activationFee}{" "}
                    {swapDetails.currency} (~${usdFee})
                  </div>
                  You'll receive: ~{Number(swapDetails.amount).toPrecision(4)}
                  {" " + swapDetails.currency} on L2
                </div>
              )}

            {userAddress ? (
              userChainDetails?.userId && (
                <div className="bridge_transfer_fee">
                  <div>
                    {transfer.type === "withdraw" ? (
                      <div>
                        <div>
                          You'll receive: ~
                          {bridgeFee && swapDetails.amount > 0
                            ? Number(
                                swapDetails.amount - bridgeFee
                              ).toPrecision(4)
                            : Number(swapDetails.amount).toPrecision(4)}
                          {" " + swapDetails.currency} on L1
                        </div>
                      </div>
                    ) : (
                      <div>
                        You'll receive: ~
                        {Number(swapDetails.amount).toPrecision(4)}
                        {" " + swapDetails.currency} on L2
                      </div>
                    )}
                  </div>
                  {/* {transfer.type === "withdraw"
                    ? "Bridge Fee:"
                    : "Bridge Fee: ~"}{" "} */}
                  {/* {typeof bridgeFee !== "number" ? (
                    <div style={{ display: "inline-flex", margin: "0 5px" }}>
                      <Loader
                        type="TailSpin"
                        color="#444"
                        height={16}
                        width={16}
                      />
                    </div>
                  ) : (
                    <div className="fee_container">
                      {transfer.type === "withdraw" ? bridgeFee : "0.000105"}
                    </div>
                  )}{" "} */}
                  {/* {transfer.type === "withdraw" ? swapDetails.currency : "ETH"} */}
                </div>
              )
            ) : (
              <div className="bridge_transfer_fee">
                🔗 &nbsp;Please connect your wallet
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={`${!showBridge ? "d-flex" : "d-none"} ${
          windowSize.innerWidth >= "960" ? "d-none" : ""
        } `}
      >
        <BridgeReceipts ReceiptsHeight="true" />
      </div>
    </>
  );
};

export default Bridge;
