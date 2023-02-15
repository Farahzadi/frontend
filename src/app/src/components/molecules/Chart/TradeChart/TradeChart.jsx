import { currencySelector, currentMarketSelector } from "lib/store/features/api/apiSlice";
import React from "react";
import { useSelector } from "react-redux";
// chart library
import TradingViewWidget, { Themes } from "react-tradingview-widget";

// css
import "./TradeChart.css";

export const TradeChart = props => {
  const currentMarket = useSelector(currentMarketSelector);
  const [baseCurrency, quoteCurrency] = useSelector(currencySelector);

  const setMarket = () => {
    let market = currentMarket;
    if (baseCurrency === "WBTC") market = quoteCurrency && "BTC-" + quoteCurrency;
    if (quoteCurrency === "WBTC") market = baseCurrency && baseCurrency + "-BTC";
    return market;
  };
  if (!currentMarket) {
    return null;
  }

  return (
    <TradingViewWidget
      symbol={setMarket().replace("-", "")}
      theme={Themes.DARK}
      save_image={false}
      hide_top_toolbar={false}
      container_id="tradingview_7f572"
      interval="D"
      timezone="Etc/UTC"
      locale="en"
      enable_publishing={false}
      hide_legend={true}
    />
  );
};
