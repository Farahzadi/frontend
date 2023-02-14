import { marketSummarySelector } from "lib/store/features/api/apiSlice";
import React from "react";
import { useSelector } from "react-redux";
import "./TradePriceHeadSecond.css";

const TradePriceHeadSecond = () => {
  const marketSummary = useSelector(marketSummarySelector);

  return (
    <>
      <div className="trade-price-head-2">
        <div>
          <h2
            className={`mt-3
              ${marketSummary.priceChange < 0 ? "down_value" : "up_value"}`}>
            {marketSummary.price}
          </h2>

          {marketSummary.priceChange < 0 ? (
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
