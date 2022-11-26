import React from "react";
import { connect } from "react-redux";
// css
import "./SpotBox.css";
// assets
import SpotForm from "components/molecules/SpotForm/SpotForm";
//actions
import {
  setOrderType,
  orderTypeSelector,
  allOrdersSelector,
  userAddressSelector,
  orderSideSelector,
} from "lib/store/features/api/apiSlice";
import api from "lib/api";

class SpotBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isBuying: false };
  }

  sellOrBuy = (isBuying) => {
    if (isBuying) {
      api.emit("orderSide", isBuying);
    }
    api.emit("orderSide", isBuying);
  };

  updateOrderType(orderType) {
    const { setOrderType } = this.props;
    setOrderType(orderType);
  }

  orderTypeTabClassName(orderType) {
    return this.props.orderType === orderType ? "trade-price-active-tab" : "";
  }

  getOrders(orderSide) {
    Object.filter = (obj, predicate) =>
      Object.keys(obj)
        .filter((key) => predicate(obj[key]))
        .reduce((res, key) => {
          res[key] = obj[key];
          return res;
        }, {});
        
    let filltered = this.props.userAddress
      ? Object.filter(
          this.props.allOrders,
          (order) =>
            order.side === orderSide 
        )
      : "";

    return filltered;
  }

  render() {
    return (
      <>
        <div className="spot_box">
          <div className="spot_head">
            <div className="sh_l">
              <h2>SPOT</h2>
            </div>
            <div className="sh_r">{/* Gas fee: $1 / trade */}</div>
          </div>
          <div className="buy_or_sell pt-2">
            <button
              onClick={() => this.sellOrBuy(false)}
              className={
                "order-btn " + (!this.props.orderSide ? "order-btn-active" : "")
              }
            >
              sell
            </button>
            <button
              onClick={() => this.sellOrBuy(true)}
              className={
                "order-btn " + (this.props.orderSide ? "order-btn-active" : "")
              }
            >
              buy
            </button>
          </div>
          <div className="spot_tabs">
            <div className="st_l">
              <h2
                className={this.orderTypeTabClassName("limit")}
                onClick={() => this.updateOrderType("limit")}
              >
                Limit
              </h2>
              {/* <h2
                className={this.orderTypeTabClassName("market")}
                onClick={() => this.updateOrderType("market")}
              >
                Swap
              </h2> */}
              <h2
                className={this.orderTypeTabClassName("marketOrder")}
                onClick={() => this.updateOrderType("marketOrder")}
              >
                Market
              </h2>
            </div>
          </div>
          <div className="spot_bottom">
            {this.props.orderSide && (
              <SpotForm
                side="b"
                lastPrice={this.props.lastPrice}
                loading={this.props.isLoading}
                signInHandler={this.props.signInHandler}
                user={this.props.user}
                currentMarket={this.props.currentMarket}
                orderType={this.props.orderType}
                activeLimitAndMarketOrdersCount={
                  this.props.activeLimitAndMarketOrdersCount
                }
                activeSwapOrdersCount={this.props.activeSwapOrdersCount}
                liquidity={this.props.liquidity}
                marketInfo={this.props.marketInfo}
                orders={this.getOrders("s")}
              />
            )}
            {!this.props.orderSide && (
              <SpotForm
                side="s"
                lastPrice={this.props.lastPrice}
                loading={this.props.isLoading}
                signInHandler={this.props.signInHandler}
                user={this.props.user}
                currentMarket={this.props.currentMarket}
                orderType={this.props.orderType}
                activeLimitAndMarketOrdersCount={
                  this.props.activeLimitAndMarketOrdersCount
                }
                activeSwapOrdersCount={this.props.activeSwapOrdersCount}
                liquidity={this.props.liquidity}
                marketInfo={this.props.marketInfo}
                orders={this.getOrders("b")}
              />
            )}
          </div>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  orderType: orderTypeSelector(state),
  allOrders: allOrdersSelector(state),
  userAddress: userAddressSelector(state),
  orderSide: orderSideSelector(state),
});

export default connect(mapStateToProps, { setOrderType })(SpotBox);
