import React, { useState, useEffect } from "react";
import { DefaultTemplate } from "components";
import { useHistory, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import "./NonceIncreasement.css";
import { Button } from "react-bootstrap";
import { networkSelector, userSelector } from "lib/store/features/api/apiSlice";
import Modal from "../../atoms/Modal";
import Core from "lib/api/Core";

const NonceIncreasement = () => {
  const [termsCheck, setTersmsCheck] = useState(false);
  const [cancelCheck, setCancelCheck] = useState(false);
  const [oldNonce, setOldNonce] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const network = useSelector(networkSelector);
  const user = useSelector(userSelector);
  const history = useHistory();
  const location = useLocation();

  const connect = () => {
    setConnecting(true);
    Core.run("connectWallet").finally(() => setConnecting(false));
  };

  const getOldNonce = () => {
    const oldNonce = user.nonce;
    setOldNonce(oldNonce);
  };

  const increaseWalletNonce = async () => {
    try {
      const res = await Core.run("increaseWalletNonce");
      const success = res.response.success;
      if (success) {
        Core.run("notify", "success", "Wallet nonce increased", { save: true });
      }
      window.location.reload(false);
    } catch (error) {
      console.log(error);
    }
  };

  const acceptNonce = async () => {
    setCancelCheck(!cancelCheck);
    setTersmsCheck(!termsCheck);
    const accept = await Modal.accept({
      cancelText: "No",
      proceedText: "Yes",
      alert: "Do you agree with all the changes?",
    });
    if (accept) increaseWalletNonce();
  };

  useEffect(() => {
    if (user.nonce) {
      getOldNonce();
    }
  }, []);

  const accept = cancelCheck && termsCheck;
  return (
    <>
      <DefaultTemplate>
        <div className="nonce-bg">
          <h2 className="mt-2">change nonce setting</h2>
          <div className="nonce-text text-white">
            {oldNonce && <h2 className="text-center mb-3 ">user wallet nonce = {oldNonce}</h2>}

            <h5 className="mb-2">Security of private key:</h5>
            <p className="mb-3">
              This is the same scenario as user’s private key security in any other layer 1 or layer 2 blockchains. We
              highly advise users to keep their assets only using non-custodial wallets. For additional security,
              hardware wallets, such as Ledger and Trezor, are also welcome that are compatible with multiple desktop
              wallets, such as Metamask.
            </p>
            <h5 className="mb-2">Security of previously submitted orders:</h5>
            <p className="mb-3">
              When a zkSync Limit order is signed by user, theoretically it can be used as long as user increases the
              account nonce by a transaction in zkSync network (i.e. transfer). Although (dex - name) ensures that open
              order limits submitted by users are only used as as long as user requested (by specifying the amount),
              users can increase their account’s nonce (provided by button below) to invalidate all previously open
              limit order in the entire zkSync’s network. However, users should note that all of their limit orders in
              all of the markets of zkSync’s network will be canceled by this action. A better way to mange multiple
              orders and ensuring the security of them over zkSync network is to handle orders of each market with its
              unique trade account as suggested by zkSync itself.
            </p>
            <h5 className="mb-2">
              <a className="text-white" href="https://docs.zksync.io/dev/swaps/#trading-accounts" target={"_blank"}>
                Employing Trade accounts:
              </a>
            </h5>
            <p>
              A trading account is an ordinary account that can be used to sign a limit order. It's function is to limit
              the amount of a certain token that a user wants to exchange. To do this, user has to:
            </p>
            <ul>
              <li>Transfer the desired amount of a desired token to a new account.</li>
              <li>Set a signing key for the account.</li>
              <li>Sign a limit order.</li>
            </ul>
            <p className="mb-1">
              This way the limit order will exchange at most the amount you transferred to the trading account.
              Remaining balance on the main account will be left untouched.
            </p>
          </div>
          <form>
            <p>
              <input
                name="termsCheck"
                type="checkbox"
                checked={termsCheck}
                onChange={() => {
                  setTersmsCheck(!termsCheck);
                }}
              />
              I agree to the terms and conditions
            </p>
            <p>
              <input
                name="isGoing"
                type="checkbox"
                checked={cancelCheck}
                onChange={() => {
                  setCancelCheck(!cancelCheck);
                }}
              />
              I agree with canceling orders
            </p>
          </form>
          {user.id ? (
            <button
              onClick={() => acceptNonce()}
              disabled={!accept}
              className={`bg_btn  btn_fix  mb-3 ${accept ? "" : "btn btn-secondary"} `}>
              Accept
            </button>
          ) : (
            <div className="spf_btn ">
              <Button loadin={connecting} className="bg_btn mx-auto" onClick={connect}>
                CONNECT
              </Button>
            </div>
          )}
        </div>
      </DefaultTemplate>
    </>
  );
};

export default NonceIncreasement;
