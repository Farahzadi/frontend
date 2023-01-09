import React, { useCallback } from "react";
import BridgeCurrencySelector from "../BridgeCurrencySelector/BridgeCurrencySelector";
import { styled } from "@mui/material";

const BridgeInputForm = styled("div")(() => ({
  display: "flex",
  borderBottom: "2px solid var(--dexpressoPrimery) !important",
  flexDirection: "row",
  alignItems: "center",
  border: "none",
  position: "relative",
  appearance: "none",
  width: "100%",

  "& input , input:focus,input::placeholder": {
    width: "100%",
    background: "transparent",
    padding: "5px 20px",
    fontSize: "28px",
    border: "none",
    outline: "none",
    color: "#fff",
    textAlign: "left",
    appearance: "none"
  }

  // .maxLink {
  //   position: absolute;
  //   color: #2f353a;
  //   top: -58px;
  //   right: 0;
  //   padding: 6px 12px;
  //   background: rgba(0, 0, 0, 0.3);
  //   border-radius: 8px;
  //   user-select: none;

  //   &:hover {
  //     color: #2f353a;
  //   }
  // }
}));
const CurrencySelector = styled("div")(({theme}) => ({
  width: "230px",
  height: "55px",
  display: "flex",
  alignItems: "center",
  marginRight: "15px",
  [theme.breakpoints.down("md")]: {
    width: "100%",
    marginRight: "0"
  }
}));
const BridgeInputBox = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column"
  }
}));
const BridgeSwapInputBox = styled("div")(() => ({
  height: "100%",
  display: "flex",
  justifyContent: "space-between",
  flexDirection: "column"
}));
const CurrencySelectorBox = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column"
  }
}));
const BridgeSwapInput = ({
  value = {},
  onChange,
  bridgeFee,
  currencies,
  balances = {},
  className,
  children,
  availableBalanceOnSelectedSide
}) => {
  const setCurrency = useCallback((currency) => onChange({ currency, amount: "" }), [onChange]);
  const setAmount = useCallback(
    (e) => onChange({ amount: e.target.value.replace(/[^0-9.]/g, "") }),
    [onChange]
  );

  let maxBalance = Number(balances?.[value.currency]?.valueReadable || 0);
  maxBalance -= 0.000105;

  const setMax = () => {
    if (maxBalance > 0) {
      onChange({ amount: maxBalance || "" });
    }
  };

  return (
    <>
      <BridgeSwapInputBox>
        <CurrencySelectorBox>
          {children}
          {availableBalanceOnSelectedSide}
        </CurrencySelectorBox>
        <BridgeInputBox>
          <CurrencySelector>
            <BridgeCurrencySelector
              currencies={currencies}
              balances={balances}
              onChange={setCurrency}
              value={value.currency}
            />
          </CurrencySelector>
          <BridgeInputForm>
            <input
              onChange={setAmount}
              value={value.amount}
              className={className}
              placeholder="0.00"
              type="text"
            />
            {false && (
              <a className="maxLink" href="#max" onClick={setMax}>
                Max
              </a>
            )}
          </BridgeInputForm>
        </BridgeInputBox>
      </BridgeSwapInputBox>
    </>
  );
};

export default BridgeSwapInput;
