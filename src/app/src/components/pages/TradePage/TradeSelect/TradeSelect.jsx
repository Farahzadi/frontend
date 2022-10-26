import React from "react";
import { Dropdown } from "react-bootstrap";
// import api from "lib/api";
// import { useState } from "react";
// css
import "./TradeSelect.css";


const TradeSelect = (props) => {
//  const [currencyLogo , setCurrencyLogo]= useState('')
  // const test = function(){
  //   let v = api.getCurrencyLogo("ETH")
  //   setCurrencyLogo(v.default)
  //   console.log(currencyLogo)  }
  return (
    <>
      <Dropdown className="w-100 newBtn">
        <Dropdown.Toggle id="dropdown-basic">
        {props.currentMarket}
        </Dropdown.Toggle>

        <Dropdown.Menu className="dropdown-menu ">
          {props.markets.map((market) => (
            <Dropdown.Item   onClick={() => props.updateMarketChain(market)} key={market}>{market}</Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      {/* <div className="tl_select">
        <div>
          <select
            value={props.currentMarket}
            onChange={(e) => props.updateMarketChain(e.target.value)}
          >
            {props.markets.map((market) => (
              <option className="select-options" key={market} value={market}>
                {market.replace("-", "/")}
              </option>
            ))}
          </select>
        </div>
      </div> */}
    </>
  );
};

export default TradeSelect;
