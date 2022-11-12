import React from "react";
import { connect } from "react-redux";

import { toast } from "react-toastify";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

import {
  configSelector,
  rangePriceSelector,
  selectedPriceSelector,
  userOrdersSelector,
} from "lib/store/features/api/apiSlice";
import api from "lib/api";
import { RangeSlider, Button } from "components";
// import ShowMessageModal from "components/atoms/ShowMessageModal/ShowMessageModal";

import "./SpotForm.css";

class SpotForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userHasEditedPrice: false,
      price: "",
      amount: "",
      baseAmount: "",
      maxSizeSelected: false,
      modalShow: false,
    };
    this.minimumAmounts = {
      ETH: 0.0002,
      WETH: 0.0001,
      USDC: 1,
      USDT: 1,
      WBTC: 0.0002,
      DAI: 1,
      FRAX: 1,
      FXS: 0.1,
    };
  }

  updatePrice(e) {
    const re = /^[0-9]*\.?[0-9]*$/;

    if (!re.test(e.target.value)) {
      return false;
    }
    const newState = { ...this.state };
    api.emit("selectedPrice", e.target.value);
    if (this.props.selectedPrice > 0 && this.props.orderType === "limit") {
      newState.price = this.props.selectedPrice;
    } else {
      newState.price = e.target.value;
    }
    newState.userHasEditedPrice = true;
    this.setState(newState);
  }

  updateAmount(e) {
    const re = /^[0-9]*\.?[0-9]*$/;

    if (!re.test(e.target.value)) {
      return false;
    }
    const newState = { ...this.state };
    api.emit("rangePrice", e.target.value);
    if (this.props.rangePrice > 0 && this.props.orderType === "limit") {
      newState.baseAmount = this.props.rangePrice;
    } else {
      newState.baseAmount = e.target.value;
    }
    if (this.props.rangePrice > 0 && this.props.orderType === "limit") {
      newState.amount = this.props.rangePrice;
    } else {
      newState.amount = e.target.value;
    }
    this.setState(newState);
  }

  getBaseBalance() {
    const baseCurrency = this.props.currentMarket.split("-")[0];
    return (
      this.props.user.committed.balances[baseCurrency] /
      Math.pow(10, api.currencies[baseCurrency].decimals)
    );
  }

  getQuoteBalance() {
    const quoteCurrency = this.props.currentMarket.split("-")[1];
    return (
      this.props.user.committed.balances[quoteCurrency] /
      Math.pow(10, api.currencies[quoteCurrency].decimals)
    );
  }

  async buySellHandler(e) {
    if (Object.keys(this.props.userOrders).length > 0) {
      for (var key in this.props.userOrders) {
        if (
          this.props.userOrders[key].status === "o" &&
          this.props.userOrders[key].side !== this.props.side
        ) {
          toast.error("Your limit order(s) should fill first");
          return;
        }
      }
    }

    let amount, baseBalance, quoteBalance, newstate, orderPendingToast, price;
    // this variable will change when different fee method has developed
    let feeType = "withoutNBX";
    let orderType = this.props.orderType === "limit" ? "l" : "m";

    if (typeof this.state.amount === "string") {
      if (this.props.rangePrice > 0) {
        amount = parseFloat(this.props.rangePrice.replace(",", "."));
      } else {
        amount = parseFloat(this.state.amount.replace(",", "."));
      }
    } else {
      amount = this.state.amount;
    }
    if (isNaN(amount)) {
      toast.error("The amount is not defined");
      return;
    }
    // await this.hideModal();
    if (sessionStorage.getItem("test") === null) {
      toast.warning(
        " Dear user, there is no guarantee from us for your definite performance"
      );
      sessionStorage.setItem("test", true);
    }
    const baseCurrency = this.props.currentMarket.split("-")[0];
    const quoteCurrency = this.props.currentMarket.split("-")[1];
    amount = parseFloat(amount.toFixed(api.currencies[baseCurrency].decimals));
    if (this.props.activeLimitAndMarketOrdersCount > 0) {
      if (this.props.orderType === "market") {
        toast.error("Your limit or market order should fill first");
        return;
      }
    }
    if (this.props.activeSwapOrdersCount > 0) {
      if (this.props.orderType === "market") {
        toast.error("Your swap order should fill first");
        return;
      }
    }

    if (this.props.user.id) {
      baseBalance = parseFloat(this.getBaseBalance());
      quoteBalance = parseFloat(this.getQuoteBalance());
    } else {
      baseBalance = 0;
      quoteBalance = 0;
    }

    if (this.props.orderType === "market") {
      price = this.currentPrice();
    } else if (this.props.orderType === "marketOrder") {
      price = this.marketPrice();
    } else {
      if (this.props.selectedPrice) {
        price = parseFloat(this.props.selectedPrice)
          .toFixed(1)
          .replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, "$1");
      } else {
        price = this.state.price;
      }
    }
    if (!price) {
      if (this.props.orderType === "limit") {
        toast.error("The price is not defined");
        return;
      } else {
        toast.error(
          `${this.props.currentMarket}: No price available right now!`
        );
        return;
      }
    }

    if (this.props.side === "s" && isNaN(baseBalance)) {
      toast.error(`No ${baseCurrency} balance`);
      return;
    }
    if (this.props.side === "b" && isNaN(quoteBalance)) {
      toast.error(`No ${quoteCurrency} balance`);
      return;
    }
    if (this.props.side === "s" && amount > baseBalance) {
      toast.error(`Amount exceeds ${baseCurrency} balance`);
      return;
    }
    if (this.props.side === "b" && amount * price > quoteBalance) {
      toast.error(`Total exceeds ${quoteCurrency} balance`);
      return;
    }
    if (amount < this.props.marketInfo.min_order_size) {
      toast.error(
        `Minimum order size is ${parseFloat(
          this.props.marketInfo.min_order_size
        )} ${baseCurrency}`
      );
      return;
    }
    if (isNaN(price)) {
      toast.error(`Price is not a number`);
    }
    if (price > this.props.lastPrice * 1.2) {
      toast.warning("Price is 20% above the spot");
    }
    if (price < this.props.lastPrice * 0.8) {
      toast.warning("Price is 20% lower than the spot");
    }
    if (price === 0) {
      toast.error(`Price should not be equal to 0`);
      return;
    }
    newstate = { ...this.state };
    newstate.orderButtonDisabled = true;
    this.setState(newstate);

    if (api.isZksyncChain()) {
      orderPendingToast = toast.info(
        "Order pending. Sign or Cancel to continue..."
      );
    }
    // send feeType for limit order (fee method)
    try {
      if (
        this.props.orderType === "limit" ||
        this.props.orderType === "marketOrder"
      ) {
        await api.submitOrder(
          this.props.currentMarket,
          this.props.side,
          price,
          amount,
          feeType,
          this.props.config.takerFee,
          orderType
        );
      } else if (this.props.orderType === "market") {
        await api.submitSwap(
          this.props.currentMarket,
          this.props.side,
          price,
          amount
        );
      }
    } catch (e) {
      console.log(e);
      toast.error(e.message);
    }

    if (api.isZksyncChain()) {
      toast.dismiss(orderPendingToast);
    }
    newstate = { ...this.state };
    newstate.orderButtonDisabled = false;
    this.setState(newstate);
  }

  priceIsDisabled() {
    return (
      this.props.orderType === "market" ||
      this.props.orderType === "marketOrder"
    );
  }

  amountPercentOfMax() {
    if (!this.props.user.id) return 0;
    let finalAmount;

    const baseCurrency = this.props.currentMarket.split("-")[0];
    const quoteCurrency = this.props.currentMarket.split("-")[1];
    if (this.props.side === "s") {
      const baseBalance =
        this.getBaseBalance() - api.currencies[baseCurrency].gasFee;
      const amount = this.state.amount || 0;
      finalAmount = amount / baseBalance;
      if (
        this.props.orderType === "limit" ||
        this.props.orderType === "marketOrder" ||
        this.props.orderType === "market"
      ) {
        return Math.round(finalAmount * 100);
      } else if (finalAmount < this.props.marketInfo.min_order_size) {
        return Math.round(finalAmount * 100);
      } else {
        return Math.round(this.props.marketInfo.min_order_size * 100);
      }
    }
    if (this.props.side === "b") {
      const quoteBalance = this.getQuoteBalance();
      const amount = this.state.amount || 0;
      const total = amount * this.currentPrice();
      finalAmount =
        total / (quoteBalance - api.currencies[quoteCurrency].gasFee);
      if (
        this.props.orderType === "limit" ||
        this.props.orderType === "marketOrder" ||
        this.props.orderType === "market"
      ) {
        return Math.round(finalAmount * 100);
      } else if (finalAmount < this.props.marketInfo.min_order_size) {
        return Math.round(finalAmount * 100);
      } else {
        return Math.round(this.props.marketInfo.min_order_size * 100);
      }
    }
  }

  currentPrice() {
    if (this.props.orderType === "limit" && this.state.price)
      return this.state.price;

    if (this.props.side === "b") {
      if (
        this.props.currentMarket === "ETH-USDT" ||
        this.props.currentMarket === "ETH-USDC" ||
        this.props.currentMarket === "ETH-DAI"
      )
        return parseFloat(
          (this.props.lastPrice * (1 + this.props.config.swapFee)).toPrecision(
            6
          )
        );
      else {
        return parseFloat(
          (
            this.props.lastPrice *
            (1 + this.props.config.swapFee * 0.1)
          ).toPrecision(6)
        );
      }
    }
    if (this.props.side === "s")
      if (
        this.props.currentMarket === "ETH-USDT" ||
        this.props.currentMarket === "ETH-USDC" ||
        this.props.currentMarket === "ETH-DAI"
      )
        return parseFloat(
          (this.props.lastPrice * (1 - this.props.config.swapFee)).toPrecision(
            6
          )
        );
      else {
        return parseFloat(
          (
            this.props.lastPrice *
            (1 - this.props.config.swapFee * 0.1)
          ).toPrecision(6)
        );
      }

    return 0;
  }

  marketPrice() {
    if (this.props.orderType === "limit" && this.state.price)
      return this.state.price;
    if (this.props.orderType === "market") return this.currentPrice();

    let orders = Object.values(this.props.orders);
    let closestOrder,
      sum = 0,
      mOrders = [],
      bestPrice = 0;
    if (orders.length > 0 && this.state.amount) {
      if (this.props.side === "b") {
        orders.sort((a, b) => {
          return b.price - a.price;
        });
        for (let i = 0; i < orders.length; i++) {
          if (orders[i].remaining >= this.state.amount) {
            closestOrder = orders[i];
            return !closestOrder ? 0 : closestOrder.price;
          } else if (sum <= this.state.amount) {
            sum += orders[i].remaining;
            mOrders.push(orders[i]);
          }
        }

        if (mOrders.length > 0) {
          bestPrice = Math.max(...mOrders.map((order) => order.price));
          return !bestPrice ? 0 : bestPrice;
        }
      }
      if (this.props.side === "s") {
        orders.sort((a, b) => {
          return a.price - b.price;
        });
        for (let i = 0; i < orders.length; i++) {
          if (orders[i].remaining > this.state.amount) {
            closestOrder = orders[i];
            return !closestOrder ? 0 : closestOrder.price;
          } else if (sum <= this.state.amount) {
            sum += orders[i].remaining;
            mOrders.push(orders[i]);
          }
        }

        if (mOrders.length > 0) {
          bestPrice = Math.min(...mOrders.map((order) => order.price));
          return !bestPrice ? 0 : bestPrice;
        }
      }
    }

    return 0;
  }

  rangeSliderHandler(e, val) {
    if (!this.props.user.id) return;

    api.emit("rangePrice", 0);
    const baseBalance = this.getBaseBalance();
    const baseCurrency = this.props.currentMarket.split("-")[0];
    const decimals = api.currencies[baseCurrency].decimals;
    const quoteBalance = this.getQuoteBalance();
    const quoteCurrency = this.props.currentMarket.split("-")[1];

    var newstate = { ...this.state };

    if (val === 100) {
      newstate.maxSizeSelected = true;
    } else {
      newstate.maxSizeSelected = false;
    }
    if (this.props.side === "s") {
      let displayAmount = (baseBalance * val) / 100;
      displayAmount -= api.currencies[baseCurrency].gasFee;
      displayAmount = parseFloat(displayAmount.toFixed(decimals)).toPrecision(
        7
      );
      if (displayAmount < 1e-5) {
        newstate.amount = 0;
      } else {
        newstate.amount = parseFloat(displayAmount.slice(0, -1));
      }
      if (displayAmount < 1e-5) {
        newstate.baseAmount = 0;
      } else {
        newstate.baseAmount = displayAmount;
      }
    } else if (this.props.side === "b") {
      let quoteAmount =
        ((quoteBalance - api.currencies[quoteCurrency].gasFee) * val) /
        100 /
        this.currentPrice();
      quoteAmount = parseFloat(quoteAmount.toFixed(decimals)).toPrecision(7);
      if (quoteAmount < 1e-5) {
        newstate.amount = 0;
        newstate.baseAmount = 0;
      } else {
        newstate.amount = parseFloat(quoteAmount.slice(0, -1));
        newstate.baseAmount = newstate.amount;
      }
    }

    if (isNaN(newstate.baseAmount)) newstate.baseAmount = 0;
    if (isNaN(newstate.amount)) newstate.amount = 0;

    this.setState(newstate);
  }

  componentDidUpdate(prevProps, prevState) {
    // Prevents bug where price volatility can cause buy amount to be too large
    // by refreshing a maxed out buy amount to match the new price
    if (
      this.props.lastPrice !== prevProps.lastPrice &&
      this.state.maxSizeSelected
    ) {
      this.rangeSliderHandler(null, 100);
    }
    if (this.props.currentMarket !== prevProps.currentMarket) {
      this.setState((state) => ({ ...state, price: "", amount: "" }));
    }
  }

  // hideModal() {
  //   let newstate = { ...this.state };

  //   if (newstate.modalShow === false) {
  //     newstate.modalShow = true;
  //   } else {
  //     newstate.modalShow = false;
  //   }
  //   this.setState(newstate);
  // }

  getLimitFeesDetails() {
    const baseCurrency = this.props.currentMarket.split("-")[0];
    const quoteCurrency = this.props.currentMarket.split("-")[1];
    let sellWithFee = this.state.amount - this.state.amount * 0.99;
    let buyWithFee =
      (this.state.amount * 1.01 - this.state.amount) * this.props.lastPrice;

    if (
      this.props.orderType === "limit" ||
      this.props.orderType === "marketOrder"
    ) {
      if (this.props.side === "s") {
        return (
          <div>
            {this.state.amount ? (
              <p>
                Dexpresso fee is{" "}
                {parseFloat(sellWithFee)
                  .toFixed(7)
                  .replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, "$1")}{" "}
                {baseCurrency}
              </p>
            ) : (
              <p>Dexpresso fee is 1% of the order valume</p>
            )}
          </div>
        );
      } else {
        return (
          <div>
            {this.state.amount ? (
              <p>
                Dexpresso fee is{" "}
                {parseFloat(buyWithFee)
                  .toFixed(7)
                  .replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, "$1")}{" "}
                {quoteCurrency}
              </p>
            ) : (
              <p>Dexpresso fee is 1% of the order valume</p>
            )}
          </div>
        );
      }
    }
  }

  getSymbol(val, quoteC) {
    if (this.props.orderType === "limit") {
      return quoteC;
    } else if (val === "") {
      return null;
    } else if (this.props.orderType !== "marketOrder") {
      return quoteC;
    }
  }

  render() {
    let price =
      this.props.orderType === "market"
        ? this.currentPrice()
        : this.marketPrice();
    // if (price === 0) price = this.props.rangePrice;

    const baseCurrency = this.props.currentMarket.split("-")[0];
    const quoteCurrency = this.props.currentMarket.split("-")[1];

    let baseBalance, quoteBalance;
    if (this.props.user.id) {
      baseBalance = this.getBaseBalance();
      quoteBalance = this.getQuoteBalance();
    } else {
      baseBalance = "-";
      quoteBalance = "-";
    }
    if (isNaN(baseBalance)) {
      baseBalance = 0;
    }
    if (isNaN(quoteBalance)) {
      quoteBalance = 0;
    }

    const balanceHtml =
      this.props.side === "b" ? (
        <strong>
          {quoteBalance.toPrecision(8)} {quoteCurrency}
        </strong>
      ) : (
        <strong>
          {baseBalance.toPrecision(8)} {baseCurrency}
        </strong>
      );

    let buySellBtnClass, buttonText, activity;
    if (this.props.side === "b") {
      if (
        (this.props.orderType === "limit" && this.props.config.limitEnabled) ||
        (this.props.orderType === "market" && this.props.config.swapEnabled) ||
        this.props.orderType === "marketOrder"
      ) {
        buySellBtnClass = "bg_btn buy_btn btn_fix";
        activity = false;
      } else if (
        (this.props.orderType === "limit" && !this.props.config.limitEnabled) ||
        (this.props.orderType === "market" && !this.props.config.swapEnabled)
      ) {
        buySellBtnClass = "bg_btn btn_fix";
        activity = true;
      }

      buttonText = "BUY";
    } else if (this.props.side === "s") {
      if (
        (this.props.orderType === "limit" && this.props.config.limitEnabled) ||
        (this.props.orderType === "market" && this.props.config.swapEnabled) ||
        this.props.orderType === "marketOrder"
      ) {
        buySellBtnClass = "bg_btn sell_btn btn_fix";
        activity = false;
      } else if (
        (this.props.orderType === "limit" && !this.props.config.limitEnabled) ||
        (this.props.orderType === "market" && !this.props.config.swapEnabled)
      ) {
        buySellBtnClass = "bg_btn btn_fix";
        activity = true;
      }

      buttonText = "SELL";
    }

    return (
      <>
        {/* <ShowMessageModal
          show={this.state.modalShow}
          onHide={() => this.hideModal()}
        /> */}
        <form className="spot_form">
          <div className="spf_head">
            <span>Availabe balance</span>
            {balanceHtml}
          </div>
          <div className="spf_input_box">
            <span className="spf_desc_text">Price</span>
            <input
              type="text"
              value={
                this.props.orderType === "marketOrder"
                  ? "Market"
                  : !isNaN(price) && this.props.orderType !== "limit"
                  ? price
                  : this.props.selectedPrice > 0
                  ? this.props.selectedPrice
                  : this.state.price
              }
              placeholder="0.0000"
              onChange={this.updatePrice.bind(this)}
              disabled={this.priceIsDisabled()}
            />
            <span className={this.priceIsDisabled() ? "text-disabled" : ""}>
              {this.getSymbol(price, quoteCurrency)}
            </span>
          </div>
          <div className="spf_input_box">
            <span className="spf_desc_text">Amount</span>
            <input
              type="text"
              value={
                this.props.orderType === "limit"
                  ? this.props.rangePrice > 0
                    ? this.props.rangePrice
                    : this.state.amount
                  : this.state.amount
              }
              placeholder="0.0000"
              onChange={this.updateAmount.bind(this)}
            />
            <span>{baseCurrency}</span>
          </div>
          <div className="spf_range">
            <RangeSlider
              value={this.amountPercentOfMax()}
              onChange={this.rangeSliderHandler.bind(this)}
            />
          </div>
          <div className="spot_box_footer">
            <div className="connect-btn">
              {this.props.user.id ? (
                <>
                  <div className="spf_head_total_amount">
                    {this.props.side === "b" ? (
                      <span>Send</span>
                    ) : (
                      <span>Receive</span>
                    )}
                    <strong>
                      {this.props.orderType === "limit" ? (
                        <>
                          {this.props.rangePrice > 0 && this.props.selectedPrice
                            ? parseFloat(
                                this.props.rangePrice * this.props.selectedPrice
                              )
                                .toFixed(2)
                                .replace(
                                  /([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,
                                  "$1"
                                )
                            : this.state.price || this.props.selectedPrice
                            ? parseFloat(
                                this.currentPrice() * this.state.baseAmount
                              )
                                .toFixed(2)
                                .replace(
                                  /([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,
                                  "$1"
                                )
                            : parseFloat(0).toPrecision(6)}{" "}
                          {this.props.marketInfo.quote_asset_name}
                        </>
                      ) : (
                        <>
                          {(
                            this.props.lastPrice * this.state.baseAmount
                          ).toPrecision(5)}{" "}
                          {this.props.marketInfo.quote_asset_name}
                        </>
                      )}
                    </strong>
                  </div>
                  {this.props.orderType === "limit" ||
                  this.props.orderType === "marketOrder" ? (
                    <OverlayTrigger
                      key={`top`}
                      placement="top"
                      overlay={
                        <Tooltip id={"top"}>
                          {this.getLimitFeesDetails()}
                        </Tooltip>
                      }
                    >
                      <div key={`top`} className="spf_fee">
                        Fees{" "}
                        <i
                          className="fa fa-question-circle"
                          aria-hidden="true"
                        ></i>
                      </div>
                    </OverlayTrigger>
                  ) : (
                    <OverlayTrigger
                      key={`top`}
                      placement="top"
                      overlay={
                        <Tooltip id={"top"}>
                          {this.getSwapFeesDetails()}
                        </Tooltip>
                      }
                    >
                      <div key={`top`} className="spf_fee">
                        Fees{" "}
                        <i
                          className="fa fa-question-circle"
                          aria-hidden="true"
                        ></i>
                      </div>
                    </OverlayTrigger>
                  )}
                </>
              ) : null}
            </div>
            {this.props.user.id ? (
              <>
                <div className="spf_btn">
                  <button
                    type="button"
                    className={buySellBtnClass}
                    onClick={this.buySellHandler.bind(this)}
                    disabled={activity}
                  >
                    {buttonText}
                  </button>
                </div>
              </>
            ) : (
              <div className="spf_btn mt-3">
                <Button
                  loadin={this.props.loading}
                  className="bg_btn"
                  text="CONNECT"
                  onClick={this.props.signInHandler}
                />
              </div>
            )}
          </div>
        </form>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  config: configSelector(state),
  rangePrice: rangePriceSelector(state),
  selectedPrice: selectedPriceSelector(state),
  userOrders: userOrdersSelector(state),
});

export default connect(mapStateToProps)(SpotForm);
