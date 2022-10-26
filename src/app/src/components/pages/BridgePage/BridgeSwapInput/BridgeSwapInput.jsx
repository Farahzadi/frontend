import React, { useCallback } from "react";
import styled from "@xstyled/styled-components";
import BridgeCurrencySelector from "../BridgeCurrencySelector/BridgeCurrencySelector";

const BridgeInputBox = styled.div`
  display: flex;
  border: 2px solid var(--purple) !important;
  flex-direction: row;
  align-items: center;
  background: #fff;
  border-radius: 24px;
  border: none;
  position: relative;
  -webkit-appearance: none;
  appearance: none;
  width: 100%;

  input,
  input:focus {
    // font-family: 'Iceland', sans-serif;
    width: calc(100% - 96px);
    background: transparent;
    padding: 5px 20px;
    font-size: 28px;
    border: none;
    outline: none;
    text-align: right;
    -webkit-appearance: none;
    appearance: none;
  }

  .maxLink {
    position: absolute;
    color: #2f353a;
    top: -58px;
    right: 0;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    user-select: none;

    &:hover {
      color: #2f353a;
    }
  }

  .currencySelector {
    width: 30%;
    height: 52px;
    display: flex;
    align-items: center;
    margin-left: 15px;
    border-right: 2px solid #5832a6;
  }
`;

const BridgeSwapInput = ({
  value = {},
  onChange,
  bridgeFee,
  currencies,
  balances = {},
  className,
}) => {
  const setCurrency = useCallback(
    (currency) => onChange({ currency, amount: "" }),
    [onChange]
  );
  const setAmount = useCallback(
    (e) => onChange({ amount: e.target.value.replace(/[^0-9.]/g, "") }),
    [onChange]
  );

  let maxBalance = parseFloat(
    (balances[value.currency] && balances[value.currency].valueReadable) || 0
  );
  maxBalance -= 0.000105;

  const setMax = () => {
    if (maxBalance > 0) {
      onChange({ amount: maxBalance || "" });
    }
  };

  return (
    <div className="mt-0 mt-md-5">
      <h5 className="mb-2">Source coin</h5>
      <BridgeInputBox>
        <div className="currencySelector">
          <BridgeCurrencySelector
            currencies={currencies}
            balances={balances}
            onChange={setCurrency}
            value={value.currency}
          />
        </div>
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
      </BridgeInputBox>
    </div>
  );
};

export default BridgeSwapInput;
