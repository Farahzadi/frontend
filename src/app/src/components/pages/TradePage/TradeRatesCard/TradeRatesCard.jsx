import React from "react";
// css
import "./TradeRatesCard.css";

class TradeRatesCard extends React.Component {

  render() {
    let baseCurrency = this.props.currentMarket?.split("-")[0] ?? "";
    let quoteCurrency = this.props.currentMarket?.split("-")[1] ?? "";
    const percentChange = ((this.props.marketSummary.priceChange / this.props.marketSummary.price) * 100).toFixed(2);

    return (
      <>
        <div className="trade_rates_container">
          <div className="rates_box last_price">
            <p>Market last price</p>
            <h1>{!this.isMarketSummeryExist ? this.props.marketSummary.price : "-.-"}</h1>
          </div>
          <div
            className={
              this.props.marketSummary.priceChange < 0
                ? "rates_box daily_change_down_value"
                : "rates_box daily_change_up_value"
            }>
            <h2>24h Change</h2>
            <p>
              {!this.isMarketSummeryExist ? this.props.marketSummary.priceChange + " " + percentChange + "%" : "-.-"}
            </p>
          </div>
          <div className="rates_box rates_box_item">
            <h2>24h High</h2>
            <p>{!this.isMarketSummeryExist ? this.props.marketSummary["24hi"] : "-.-"}</p>
          </div>
          <div className="rates_box rates_box_item">
            <h2>24hLow</h2>
            <p>{!this.isMarketSummeryExist ? this.props.marketSummary["24lo"] : "-.-"}</p>
          </div>
          <div className="rates_box rates_box_item d-none d-lg-block">
            <h2>24h Volume({baseCurrency})</h2>
            <p>{!this.isMarketSummeryExist ? this.props.marketSummary.baseVolume : "-.-"}</p>
          </div>
          <div className="rates_box rates_box_item d-none d-lg-block">
            <h2>24h Volume({quoteCurrency})</h2>
            <p>{!this.isMarketSummeryExist ? this.props.marketSummary.quoteVolume : "-.-"}</p>
          </div>
        </div>
      </>
    );
  }

}

export default TradeRatesCard;
