import React from "react";
// css
import "./TradeHead.css";
import "bootstrap/dist/css/bootstrap.min.css";
// components
import TradeRatesCard from "../TradeRatesCard/TradeRatesCard";
import TradeSelect from "../TradeSelect/TradeSelect";

const TradeHead = props => {
  return (
    <>
      <div className="tl_head">
        <div className="container-fluid ">
          <div className="row px-2 ">
            <div className="col-5 col-sm-3 col-lg-2">
              <TradeSelect />
            </div>
            <div className="col-7 col-sm-9 col-lg-10 ">
              <TradeRatesCard />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TradeHead;
