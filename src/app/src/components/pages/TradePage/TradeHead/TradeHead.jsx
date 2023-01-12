import React from "react";
// css
import "./TradeHead.css";
import "bootstrap/dist/css/bootstrap.min.css";
// components
import TradeRatesCard from "components/pages/TradePage/TradeRatesCard/TradeRatesCard";
import TradeSelect from "components/pages/TradePage/TradeSelect/TradeSelect";

const TradeHead = props => {
  return (
    <>
      <div className="tl_head">
        <div className="container-fluid ">
          <div className="row px-2 ">
            <div className="col-5 col-sm-3 col-lg-2">
              <TradeSelect
                updateMarketChain={props.updateMarketChain}
                markets={props.markets}
                currentMarket={props.currentMarket}
              />
            </div>
            <div className="col-7 col-sm-9 col-lg-10 ">
              <TradeRatesCard marketSummary={props.marketSummary} currentMarket={props.currentMarket} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TradeHead;
