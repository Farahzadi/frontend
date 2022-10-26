import React from "react";
import "./TradePriceHeadSecond.css";

const TradePriceHeadSecond = (props) => {
  return (
    <>
      <div className="trade-price-head-2">
        <div>
          <h2
            className={ `mt-3
              ${props.marketSummary.priceChange < 0 ? "down_value" : "up_value"}`
            }
          >
            {props.marketSummary.price}
          </h2>

          {props.marketSummary.priceChange < 0 ? (
            <span className="text-danger mt-2">&#9660;</span>
          ) : (
            <span className="text-success mt-2">&#9650;</span>
          )}
        </div>
      </div>
    </>
  );
};

export default TradePriceHeadSecond;
