import React from "react";
import { Dropdown } from "react-bootstrap";
// import { useState } from "react";
// css
import "./TradeSelect.css";
import { useDispatch, useSelector } from "react-redux";
import { currentMarketSelector, marketListSelector, setCurrentMarket } from "lib/store/features/api/apiSlice";

const TradeSelect = props => {
  const markets = useSelector(marketListSelector);
  const currentMarket = useSelector(currentMarketSelector);
  const dispatch = useDispatch();

  //  const [currencyLogo , setCurrencyLogo]= useState("")
  // const test = function(){
  //   let v = Core.run("getCurrencyLogo", "ETH")
  //   setCurrencyLogo(v.default)
  //   console.log(currencyLogo)  }
  const handleChangeMarket = market => {
    dispatch(setCurrentMarket(market));
    // window.scrollTo(0, 0); // why ?? MM
  };
  return (
    <>
      <Dropdown className="w-100 newBtn">
        <Dropdown.Toggle id="dropdown-basic">{currentMarket ?? ""}</Dropdown.Toggle>

        <Dropdown.Menu className="dropdown-menu ">
          {markets.map(market => (
            <Dropdown.Item onClick={() => handleChangeMarket(market)} key={market}>
              {market}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
};

export default TradeSelect;
