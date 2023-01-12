import React from "react";
import { Dropdown } from "react-bootstrap";
// import { useState } from "react";
// css
import "./TradeSelect.css";

const TradeSelect = props => {
  //  const [currencyLogo , setCurrencyLogo]= useState('')
  // const test = function(){
  //   let v = Core.run("getCurrencyLogo", "ETH")
  //   setCurrencyLogo(v.default)
  //   console.log(currencyLogo)  }
  return (
    <>
      <Dropdown className="w-100 newBtn">
        <Dropdown.Toggle id="dropdown-basic">{props.currentMarket ?? ""}</Dropdown.Toggle>

        <Dropdown.Menu className="dropdown-menu ">
          {props.markets.map(market => (
            <Dropdown.Item onClick={() => props.updateMarketChain(market)} key={market}>
              {market}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
};

export default TradeSelect;
