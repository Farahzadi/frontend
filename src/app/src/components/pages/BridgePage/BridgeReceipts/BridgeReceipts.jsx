import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  bridgeReceiptsSelector,
  userAddressSelector,
  clearBridgeReceipts,
} from "lib/store/features/api/apiSlice";

import { formatDistance } from "date-fns";

const BridgeReceipts = (props) => {
  const [finalReceipts, setFinalReceipts] = useState([]);

  const receipts = useSelector(bridgeReceiptsSelector);
  const userAddress = useSelector(userAddressSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    filterReceipts();
  }, [userAddress, receipts]);

  const filterReceipts = () => {
    if (receipts) {
      const final = Array.isArray(receipts)
        ? receipts.filter((r) => r.userAddress === userAddress)
        : [];
      setFinalReceipts(final);
    }
  };

  const api = {}; // TODO replace api

  return (
    <div
      className={`bridge_box bridge_box_receipts ${
        props.ReceiptsHeight ? "ReceiptsHeight" : ""
      }`}
    >
      <h6 className="bridge_box_receipt_head">
        {api._accountState !== null ? finalReceipts.length : null} receipts (
        <span
          onClick={() => dispatch(clearBridgeReceipts(userAddress))}
          className="bridge_link"
        >
          Clear All
        </span>
        )
      </h6>
      <div className="bridge_box_transactions">
        {finalReceipts.length === 0 && (
          <h5 style={{ padding: 26 }}>No bridge receipts yet.</h5>
        )}
        {api._accountState !== null
          ? finalReceipts.map((r) => (
              <div
                onClick={() => window.open(r.txUrl)}
                key={r.txId}
                className="bridge_box_transaction"
              >
                <div className="bridge_contain">
                  <div className={`bridge_box_transaction_txType_${r.type}`}>
                    {r.type}
                  </div>
                  <div className="bridge_box_transaction_amount">
                    {r.amount} {r.token}
                  </div>
                  <div className="bridge_box_transaction_txId">
                    {formatDistance(r.date, new Date(), { addSuffix: true })}{" "}
                    &bull; {`${r.txId.substr(0, 6)}...${r.txId.substr(-6)}`}
                  </div>
                  <div className="bridge_box_transaction_txId">
                    {r.status === "success" ? (
                      <div>
                        <>
                          <span className="text-success">{r.status} </span>
                          <i class="fa-solid fa-check-double"></i>
                        </>
                      </div>
                    ) : r.status === "committed" ? (
                      <div>
                        <>
                          <span className="text-success"> success </span>
                          <i class="fa-solid fa-check-double"></i>
                        </>
                      </div>
                    ) : (
                      <div>
                        <>
                          <span className="text-info">{r.status} </span>
                        </>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  );
};

export default BridgeReceipts;
