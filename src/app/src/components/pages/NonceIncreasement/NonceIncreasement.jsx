import React, { useState, useEffect } from "react";
import { DefaultTemplate } from "components";
import { useHistory, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { userSelector } from "lib/store/features/auth/authSlice";
import "./NonceIncreasement.css";
import api from "lib/api";
import { Button } from "react-bootstrap";
import { networkSelector } from "lib/store/features/api/apiSlice";
import { toast } from "react-toastify";

import Box from "@mui/material/Box";
import Backdrop from "@mui/material/Backdrop";

import Modal from "@mui/material/Modal";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const NonceIncreasement = () => {
  const [termsCheck, setTersmsCheck] = useState(false);
  const [cancelCheck, setCancelCheck] = useState(false);
  const [oldNonce, setOldNonce] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const network = useSelector(networkSelector);
  const user = useSelector(userSelector);
  const history = useHistory();
  const location = useLocation();

  const connect = () => {
    setConnecting(true);
    api
      .signIn(network)
      .then((state) => {
        if (!state.id && !/^\/bridge(\/.*)?/.test(location.pathname)) {
          history.push("/bridge");
        }
        setConnecting(false);
      })
      .catch(() => setConnecting(false));
  };

  const acceptNonce = () => {
    handleOpen();
    setCancelCheck(!cancelCheck);
    setTersmsCheck(!termsCheck);
  };

  const getOldNonce = () => {
    const oldNonce = user.committed.nonce;
    setOldNonce(oldNonce);
  };
  const increaseWalletNonce = async () => {
    try {
      const res = await api.increaseWalletNonce();
      const success = res.response.success;
      if (success) {
        toast.success("wallet nonce increased");
      }
      window.location.reload(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user.committed) {
      getOldNonce();
    }
  }, []);

  const accept = cancelCheck && termsCheck;
  return (
    <>
      <DefaultTemplate>
        <Modal
          aria-labelledby="spring-modal-title"
          aria-describedby="spring-modal-description"
          open={open}
          onClose={handleClose}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Box sx={style}>
            <h5 className="text-center">Do you agree with all the changes?</h5>

            <div className="mt-5">
              <div className="d-flex w-100 text-center justify-content-around">
                <Button
                  size="lg"
                  variant="outline-success "
                  onClick={() => {
                    handleClose();
                    increaseWalletNonce();
                  }}
                >
                  Yes
                </Button>
                <Button
                  size="lg"
                  variant="outline-danger "
                  onClick={handleClose}
                >
                  No
                </Button>
              </div>
            </div>
          </Box>
        </Modal>
        <div className="nonce-bg">
          <h2 className="mt-2">change nonce setting</h2>
          <div className="nonce-text text-white">
            {oldNonce && (
              <h2 className="text-center mb-3 ">
                user wallet nonce = {oldNonce}
              </h2>
            )}

            <h5 className="mb-2">Security of private key:</h5>
            <p className="mb-3">
              This is the same scenario as user’s private key security in any
              other layer 1 or layer 2 blockchains. We highly advise users to
              keep their assets only using non-custodial wallets. For additional
              security, hardware wallets, such as Ledger and Trezor, are also
              welcome that are compatible with multiple desktop wallets, such as
              Metamask.
            </p>
            <h5 className="mb-2">Security of previously submitted orders:</h5>
            <p className="mb-3">
              When a zkSync Limit order is signed by user, theoretically it can
              be used as long as user increases the account nonce by a
              transaction in zkSync network (i.e. transfer). Although (dex -
              name) ensures that open order limits submitted by users are only
              used as as long as user requested (by specifying the amount),
              users can increase their account’s nonce (provided by button
              below) to invalidate all previously open limit order in the entire
              zkSync’s network. However, users should note that all of their
              limit orders in all of the markets of zkSync’s network will be
              canceled by this action. A better way to mange multiple orders and
              ensuring the security of them over zkSync network is to handle
              orders of each market with its unique trade account as suggested
              by zkSync itself.
            </p>
            <h5 className="mb-2">
              <a
                className="text-white"
                href="https://docs.zksync.io/dev/swaps/#trading-accounts"
              >
                Employing Trade accounts:
              </a>
            </h5>
            <p>
              A trading account is an ordinary account that can be used to sign
              a limit order. It's function is to limit the amount of a certain
              token that a user wants to exchange. To do this, user has to:
            </p>
            <ul>
              <li>
                Transfer the desired amount of a desired token to a new account.
              </li>
              <li>Set a signing key for the account.</li>
              <li>Sign a limit order.</li>
            </ul>
            <p className="mb-1">
              This way the limit order will exchange at most the amount you
              transferred to the trading account. Remaining balance on the main
              account will be left untouched.
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
              className={`bg_btn  btn_fix  mb-3 ${
                accept ? "" : "btn btn-secondary"
              } `}
            >
              Accept
            </button>
          ) : (
            <div className="spf_btn ">
              <Button
                loadin={connecting}
                className="bg_btn mx-auto"
                onClick={connect}
              >
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
