import darkPlugHead from "assets/icons/dark-plug-head.png";
import { Button } from "components";
import { BiError } from "react-icons/bi";
import { MdSwapCalls } from "react-icons/md";
import cx from "classnames";
import { useEffect, useState } from "react";
import Loader from "react-loader-spinner";
import Modal from "components/atoms/Modal";
import { useSelector } from "react-redux";
import { networkConfigSelector } from "lib/store/features/api/apiSlice";

const BridgeModal = ({
  transfer,
  doTransfer,
  approveSpend,
  swapDetails,
  bridgeFee,
  formErr,
  userAddress,
  balances,
  userChainDetails,
  disconnect,
  hasError,
  hasAllowance,
  activationFee,
  usdFee,
}) => {
  const [loading, setLoading] = useState(false);

  const handleAccept = async e => {
    e.preventDefault();
    setLoading(true);
    await doTransfer?.();
    setLoading(false);
    Modal.close();
  };
  const networkConfig = useSelector(networkConfigSelector);

  const { hasBridge, hasWrapper } = networkConfig;

  const ethLayer1HeaderDetails = (
    <div className="bridge_coin_details">
      <p>{hasBridge ? "Ethereum L1" : hasWrapper ? "ETH" : ""}</p>
    </div>
  );
  const zkSyncLayer2HeaderDetails = (
    <div className="bridge_coin_details mx-auto">
      <p>{hasBridge ? "zkSync(V1) L2" : hasWrapper ? "Wrapped ETH" : ""} </p>
    </div>
  );
  return (
    <div className="bridge_box_right_content container">
      <div className="row">
        <div className="col-6-border">
          <p>
            <small>Source Network:</small>
          </p>
          <p>
            <b>{transfer.type !== "withdraw" ? ethLayer1HeaderDetails : zkSyncLayer2HeaderDetails}</b>
            <i class="fa-solid fa-arrow-right"></i>
          </p>
        </div>
        <div className="col-5-border mb-2">
          <p>
            <small>Destination Network:</small>
          </p>
          <p>
            <b>{transfer.type === "withdraw" ? ethLayer1HeaderDetails : zkSyncLayer2HeaderDetails}</b>
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
            <small>Destination coin:</small>
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
                  <Loader type="TailSpin" color="#444" height={16} width={16} />
                </div>
              ) : (
                <div className="fee_container">{transfer.type === "withdraw" ? bridgeFee : "0.000105"}</div>
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
              zig_disabled: formErr.length > 0 || swapDetails.amount.length === 0,
            })}
            text="APPROVE"
            style={{ marginBottom: 10 }}
            onClick={approveSpend}
          />
        )}
        {userAddress && hasError && (
          <Button className="bg_btn bg_btn-transfer zig_btn_disabled bg_err" text={formErr} icon={<BiError />} />
        )}
        {userAddress && !hasError && (
          <Button
            loading={loading}
            className={cx("bg_btn bg_btn-transfer", {
              zig_disabled: bridgeFee === null || !hasAllowance || swapDetails.amount.length === 0,
            })}
            text="TRANSFER"
            icon={<MdSwapCalls />}
            onClick={handleAccept}
          />
        )}
      </div>
      <div>
        {userAddress ? (
          <div className="bridge_connected_as">
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
      {transfer.type === "deposit" && userAddress && !userChainDetails?.userId && (
        <div className="bridge_transfer_fee">
          <div>
            One-Time Activation Fee: {activationFee} {swapDetails.currency} (~${usdFee})
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
                      ? Number(swapDetails.amount - bridgeFee).toPrecision(4)
                      : Number(swapDetails.amount).toPrecision(4)}
                    {" " + swapDetails.currency} on L1
                  </div>
                </div>
              ) : (
                <div>
                  You'll receive: ~{Number(swapDetails.amount).toPrecision(4)}
                  {" " + swapDetails.currency} on L2
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="bridge_transfer_fee">🔗 &nbsp;Please connect your wallet</div>
      )}
    </div>
  );
};

export default BridgeModal;
