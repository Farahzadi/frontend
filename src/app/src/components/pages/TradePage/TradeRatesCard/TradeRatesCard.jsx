import { currencySelector, currentMarketSelector, marketSummarySelector } from "lib/store/features/api/apiSlice";
import React from "react";
import { useSelector } from "react-redux";
// css
import "./TradeRatesCard.css";

const TradeRatesCard = () => {
  const currentMarket = useSelector(currentMarketSelector);
  const [baseCurrency, quoteCurrency] = useSelector(currencySelector);
  const marketSummary = useSelector(marketSummarySelector);

  const calculatePercentage = () => {
    return ((marketSummary.priceChange / marketSummary.price) * 100).toFixed(2);
  };

  return (
    <>
      <div className="trade_rates_container">
        <div className="rates_box last_price">
          <p>Market last price</p>
          <h1>{marketSummary.price ?? "-.-"}</h1>
        </div>
        <div
          className={
            marketSummary.priceChange < 0 ? "rates_box daily_change_down_value" : "rates_box daily_change_up_value"
          }>
          <h2>24h Change</h2>
          <p>{marketSummary.priceChange ? marketSummary.priceChange + " " + calculatePercentage() + "%" : "-.-"}</p>
        </div>
        <div className="rates_box rates_box_item">
          <h2>24h High</h2>
          <p>{marketSummary["24hi"] ?? "-.-"}</p>
        </div>
        <div className="rates_box rates_box_item">
          <h2>24hLow</h2>
          <p>{marketSummary["24lo"] ?? "-.-"}</p>
        </div>
        <div className="rates_box rates_box_item d-none d-lg-block">
          <h2>24h Volume({baseCurrency})</h2>
          <p>{marketSummary.baseVolume ?? "-.-"}</p>
        </div>
        <div className="rates_box rates_box_item d-none d-lg-block">
          <h2>24h Volume({quoteCurrency})</h2>
          <p>{marketSummary.quoteVolume ?? "-.-"}</p>
        </div>
      </div>
    </>
  );
};

export default TradeRatesCard;
