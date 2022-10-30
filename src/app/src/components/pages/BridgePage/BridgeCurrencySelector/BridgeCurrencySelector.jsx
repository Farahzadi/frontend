import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { networkSelector } from "lib/store/features/api/apiSlice";
import { userSelector } from "lib/store/features/auth/authSlice";
import styled, { css } from "@xstyled/styled-components";
import { FiChevronDown } from "react-icons/fi";
import { useCoinEstimator } from "components";
import { formatUSD } from "lib/utils";
import api from "lib/api";

const StyledBridgeCurrencySelector = styled.div`
  padding: 0 0 0 3px;
  background-color: #fff;
  border-radius: 15px;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  border: 1px solid #fff;
  cursor: pointer;
  user-select: none;

  select {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
  }
`;

const BridgeCurrencyWrapper = styled.div`
  // position: relative;

  .currencyIcon > img {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .currencyName {
    flex: 1 1 auto;
    margin-left: 8px;
    font-size: 15px;
    color: #fff;

    svg {
      position: relative;
      top: -1px;
      margin-left: 5px;
    }
  }
`;

const BridgeCurrencyOptions = styled.ul`
  position: absolute;
  top: -619%;
  left: -65%;
  z-index: 20;
  backdrop-filter: blur(10px);
  width: 90vw;
  height: 90vh;
  box-shadow: 0 2px 7px 3px rgba(0, 0, 0, 0.2);
  // background: #fff;
  padding: 0;
  list-style-type: none;
  border-radius: 15px;
  opacity: 0;
  pointer-events: none;
  transform: rotate(180deg) translateY(20px);
  cursor: pointer;
  .border-side {
    border-left: 1px solid #5e35b1;
    border-right: 1px solid #5e35b1;
  }
  .border-top {
    border-top: 1px solid #5e35b1 !important;
  }
  .border-bottom {
    border-bottom: 1px solid #5e35b1 !important;
  }

  .input-box {
    background: #100c22;
    width: 25%;
    margin: 0 auto;
    padding-top: 1px;
    padding-bottom: 1px;

    .input-search {
      margin: 10px auto;
      display: block;
      height: 40px;
      color: #fff;
      background: #1d1d2c;
      border-radius: 15px;
      text-align: left;
      font-size: 20px;
    }
    .input-search:focus {
      height: 40px;
      background: #1d1d2c;
    }
  }

  ${(p) =>
    p.show &&
    css`
      opacity: 1;
      pointer-events: all;
      transform: rotate(0deg) translateY(0);
    `}

  .currencyBalance {
    line-height: 1.1;
    text-align: right;
    margin-left: auto;
    color: #fff;

    strong {
      display: block;
      font-weight: 600;
      // font-family: "Iceland", sans-serif;
      font-size: 18px;
      color: #fff;
    }

    small {
      font-size: 12px;
    }
  }

  .currencyOption {
    display: flex;
    padding: 13px;
    width: 25%;
    margin: auto;
    background: #100c22;
    flex-direction: row;
    align-items: center;
    border-left: 1px solid #5e35b1;
    border-right: 1px solid #5e35b1;

    &:first-child {
      border-top-left-radius: 15px;
      border-top-right-radius: 15px;
      margin-top: 10%;
    }

    &:last-child {
      border-bottom-left-radius: 15px;
      border-bottom-right-radius: 15px;
    }

    // &:hover {
    //   background: #eee;
    // }

    &:active,
    &:focus {
      background: #423a66;
    }
  }
`;

const BridgeCurrencySelector = ({
  onChange,
  currencies,
  balances = {},
  value,
}) => {
  const [tickers, setTickers] = useState([]);
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const [showingOptions, setShowingOptions] = useState(false);
  const network = useSelector(networkSelector);
  const user = useSelector(userSelector);
  const coinEstimator = useCoinEstimator();

  useEffect(() => {
    const tickers = (currencies || Object.keys(api.currencies))
      .filter((c) => {
        return api.currencies[c].chain[network];
      })
      .sort();

    setTickers(tickers);
    onChange(api.currencies["ETH"] ? "ETH" : tickers[0]);
  }, [user.id, network, currencies]);

  const inputTest = (val) => {
    if (val.target.value === "") {
      const tickers = (currencies || Object.keys(api.currencies))
        .filter((c) => {
          return api.currencies[c].chain[network];
        })
        .sort();
      return setTickers(tickers);
    }
    const arr = tickers.filter((i) =>
      i.includes(val.target.value.toUpperCase())
    );
    setTickers(arr);
  };
  // const inputTest = (val) => {
  //   console.warn(val.target.value);
  // };

  const hideOptions = (e) => {
    if (e) e.preventDefault();
    setShowingOptions(false);
  };

  const toggleOptions = (e) => {
    if (e) e.preventDefault();
    e.stopPropagation();
    setShowingOptions(!showingOptions);
  };

  useEffect(() => {
    if (showingOptions) {
      window.addEventListener("click", hideOptions, false);
    }

    return () => {
      window.removeEventListener("click", hideOptions);
    };
  }, [showingOptions]);
  useEffect(() => {
    function handleWindowResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  if (!value) {
    return null;
  }

  const currency = api.currencies[value];

  const selectOption = (ticker) => (e) => {
    if (e) e.preventDefault();
    onChange(ticker);
  };
  function getWindowSize() {
    const {innerWidth, innerHeight} = window;
    return {innerWidth, innerHeight};
  }

  return (
    <BridgeCurrencyWrapper>
      <StyledBridgeCurrencySelector onClick={toggleOptions}>
        <div className="currencyIcon">
          <img src={currency.image.default} alt={currency.name} />
        </div>
        <div className="currencyName text-dark">
          {value}
          <FiChevronDown />
        </div>
      </StyledBridgeCurrencySelector>
      <BridgeCurrencyOptions className={`${windowSize.innerWidth  <="960" ? "select-currency-width" : ""} `} show={showingOptions}>
        <li className="currencyOption w-md-100 text-white border-top border-bottom">
          SELECT A TOKEN
        </li>
        <div
          className="border-side input-box"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            className="input-search"
            onChange={inputTest}
            placeholder="search"
          />
        </div>
        {tickers.map((ticker, key, tickers) =>
          ticker === value ? null : (
            <li
              key={key}
              onClick={selectOption(ticker)}
              tabIndex="0"
              className={`currencyOption ${
                key + 1 === tickers.length ? "border-bottom" : ""
              }`}
            >
              <div className="currencyIcon">
                <img
                  src={api.currencies[ticker].image.default}
                  alt={currency.name}
                />
              </div>
              <div className="currencyName">{ticker}</div>
              {balances[ticker] && (
                <div className="currencyBalance">
                  <strong>{balances[ticker].valueReadable}</strong>
                  <small>
                    $
                    {formatUSD(
                      coinEstimator(ticker) * balances[ticker].valueReadable
                    )}
                  </small>
                </div>
              )}
            </li>
          )
        )}
        {!tickers.length && (
          <li
            className="currencyOption border-bottom text-white
              "
          >
            No matches found
          </li>
        )}
      </BridgeCurrencyOptions>
    </BridgeCurrencyWrapper>
  );
};

export default BridgeCurrencySelector;