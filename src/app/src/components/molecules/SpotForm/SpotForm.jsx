import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

import {
  configSelector,
  rangePriceSelector,
  selectedPriceSelector,
  userOrdersSelector,
  orderSideSelector,
  allOrdersSelector,
  marketInfoSelector,
  userSelector,
  orderTypeSelector,
  currentMarketSelector,
  currencySelector,
  marketSummarySelector,
  connectionStageSelector,
} from "lib/store/features/api/apiSlice";
import { RangeSlider } from "components";
import "./SpotForm.css";
import Currencies from "config/Currencies";
import Core from "lib/api/Core";
import { removeTrailingZeros } from "lib/utils";
import { activeOrderStatuses, NetworkStages } from "lib/interface";

const numberRegex = /^[0-9]*\.?[0-9]*$/;
export const SpenderSide = {
  b: "Send",
  s: "Recieve",
};

const SpotForm = () => {
  const config = useSelector(configSelector);
  const rangePrice = useSelector(rangePriceSelector);
  const selectedPrice = useSelector(selectedPriceSelector);
  const orderSide = useSelector(orderSideSelector);
  const allOrders = useSelector(allOrdersSelector);
  const marketInfo = useSelector(marketInfoSelector);
  const user = useSelector(userSelector);
  const orderType = useSelector(orderTypeSelector);
  const currentMarket = useSelector(currentMarketSelector);
  const marketSummary = useSelector(marketSummarySelector);
  const [baseCurrency, quoteCurrency] = useSelector(currencySelector);
  const connetionStage = useSelector(connectionStageSelector);

  const activeLimitAndMarketOrders = Object.values(useSelector(userOrdersSelector)).filter(
    order => activeOrderStatuses.includes(order.status) && order.type === "l",
  );
  const [flags, setFlags] = useState({
    maxSizeSelected: false,
    userHasEditedPrice: false,
    modalShow: false,
  });
  const [order, setOrder] = useState({
    price: "",
    amount: "",
    baseAmount: "",
    orderSide: "",
  });
  const isUserConnected = connetionStage === NetworkStages.CONNECTED;
  const getBaseBalance = () => {
    return user.availableBalances?.[baseCurrency]?.valueReadable ?? "0";
  };

  const getQuoteBalance = () => {
    return user.availableBalances?.[quoteCurrency]?.valueReadable ?? "0";
  };
  const rangeSliderHandler = (e, val) => {
    if (!isUserConnected) return;
    Core.run("emit", "rangePrice", 0);
    const baseBalance = getBaseBalance();
    const decimals = Currencies[baseCurrency].decimals;
    const quoteBalance = getQuoteBalance();

    let newstate = { ...order };

    if (val === 100) {
      newstate.maxSizeSelected = true;
    } else {
      newstate.maxSizeSelected = false;
    }
    if (orderSide === "s") {
      let displayAmount = (baseBalance * val) / 100;
      displayAmount = parseFloat(displayAmount.toFixed(decimals)).toPrecision(7);
      if (displayAmount < 1e-5) {
        newstate.amount = 0;
        newstate.baseAmount = 0;
      } else {
        newstate.amount = parseFloat(displayAmount.slice(0, -1));
        newstate.baseAmount = displayAmount;
      }
    } else if (orderSide === "b") {
      let quoteAmount = (quoteBalance * val) / 100;
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
    setOrder(newstate);
  };

  useEffect(() => {
    // Prevents bug where price volatility can cause buy amount to be too large
    // by refreshing a maxed out buy amount to match the new price
    if (order.maxSizeSelected) {
      rangeSliderHandler(null, 100);
    }
  }, [marketSummary.lastPrice]);

  useEffect(() => {
    setOrder({ ...order, price: "", amount: "" });
  }, [currentMarket]);

  const updatePrice = e => {
    if (!numberRegex.test(e.target.value)) {
      return false;
    }
    let price;
    if (selectedPrice > 0 && orderType === "limit") {
      Core.run("emit", "selectedPrice", e.target.value);
      price = selectedPrice;
    } else {
      price = e.target.value;
    }
    setOrder({ ...order, price });
    setFlags({ ...flags, userHasEditedPrice: true });
  };

  const updateAmount = e => {
    if (!numberRegex.test(e.target.value)) {
      return false;
    }
    let baseAmount, amount;
    if (rangePrice > 0 && orderType === "limit") {
      Core.run("emit", "rangePrice", e.target.value);
      baseAmount = rangePrice;
    } else {
      baseAmount = e.target.value;
      amount = e.target.value;
    }
    setOrder({ ...order, amount, baseAmount });
  };

  const getOrders = (isBuy = true) => {
    return isBuy
      ? Object.values(allOrders.filter(order => order.side === "b").sort((orderA, orderB) => orderB - orderA))
      : Object.values(allOrders.filter(order => order.side === "s").sort((orderA, orderB) => orderA - orderB));
  };
  const currentPrice = () => {
    if (orderType === "limit" && order.price) return order.price;
    if (marketSummary.lastPrice) return +marketSummary.lastPrice.toPrecision(6);
    return 0;
  };

  const marketPrice = (isBuy = true) => {
    if (orderType === "limit") return order.price;

    let orders = getOrders(!isBuy);
    let totalAmount;
    if (orders.length > 0 && order.amount) {
      orders.sort((orderA, orderB) => {
        return isBuy ? orderA.price - orderB.price : orderB.price - orderA.price;
      });
      for (const selectedOrder of orders) {
        const { remaining, price } = selectedOrder;
        totalAmount += remaining;
        if (totalAmount >= order.amount) {
          return price;
        }
      }
    }
    return 0;
  };

  const HandleTrade = async e => {
    let amount, price;
    // amount
    if (typeof order.amount === "string") {
      if (rangePrice > 0) {
        amount = rangePrice.replace(",", ".");
      } else {
        amount = order.amount.replace(",", ".");
      }
    } else {
      amount = order.amount;
    }

    if (sessionStorage.getItem("test") === null) {
      Core.run("notify", "warning", "Dear user, there is no guarantee from us for your definite performance", {
        save: true,
      });
      sessionStorage.setItem("test", true);
    }

    if (activeLimitAndMarketOrders.length > 0) {
      if (orderType === "market") {
        Core.run("notify", "error", "Your limit or market order should fill first");
        return;
      }
    }

    // price
    if (orderType === "marketOrder") {
      price = orderSide === "s" ? marketPrice(false) : marketPrice();
    } else {
      if (selectedPrice) {
        price = selectedPrice;
      } else {
        price = order.price;
      }
    }

    let data;
    try {
      data = await Core.run("validateOrder", {
        market: currentMarket,
        amount,
        price,
        side: orderSide,
        type: orderType === "limit" ? "l" : "m",
      });
    } catch (err) {
      Core.run("notify", "error", err.message);
      return;
    }

    setFlags({ ...flags, orderButtonDisabled: true });
    setOrder({ ...order, price });

    const orderPendingNotif = await Core.run("notify", "loading", "Order pending. Sign or Cancel to continue...", {
      save: true,
    });
    // send feeType for limit order (fee method)
    try {
      await Core.run("submitOrder", data);
      Core.run("notify", "remove", orderPendingNotif);
    } catch (e) {
      console.log(e);
      Core.run("notify", "finish", orderPendingNotif, "error", e.message);
    }

    setFlags({ ...flags, orderButtonDisabled: false });
  };

  const priceIsDisabled = () => {
    return orderType === "market" || orderType === "marketOrder";
  };

  const amountPercentOfMax = () => {
    if (isUserConnected) return 0;
    const validOrderTypes = ["limit", "marketOrder", "market"];
    const baseBalance = getBaseBalance();
    const quoteBalance = getQuoteBalance();
    const amount = order.amount ?? 0;
    let finalAmount;
    if (!+baseBalance) return 0;
    finalAmount = amount / (orderSide === "s" ? baseBalance : quoteBalance);
    if (validOrderTypes.includes(orderType)) {
      return Math.round(finalAmount * 100);
    } else if (finalAmount < marketInfo.min_order_size) {
      return Math.round(finalAmount * 100);
    } else {
      return Math.round(marketInfo.min_order_size * 100);
    }
  };

  const getPrice = () => {
    return orderType === "market" ? currentPrice() : marketPrice();
  };

  const renderFeesDetails = () => {
    let sellWithFee = order.amount - order.amount * 0.99;
    let buyWithFee = (order.amount * 1.01 - order.amount) * marketSummary.lastPrice;
    let fee = order.amount ? (orderSide === "s" ? sellWithFee : buyWithFee) : null;
    fee = removeTrailingZeros(fee, 7);
    const currency = orderSide === "s" ? baseCurrency : quoteCurrency;
    const text = fee ? `Dexpresso fee is ${fee} ${currency}` : "Dexpresso fee is 1% of the order valume";

    return (
      <div>
        <p>{text}</p>
      </div>
    );
  };

  const getSymbol = (val, quoteC) => {
    if (orderType === "limit") {
      return quoteC;
    } else if (val === "") {
      return null;
    } else if (orderType !== "marketOrder") {
      return quoteC;
    }
  };

  const isTradeDisabled = () => {
    if (
      (orderType === "limit" && config.limitEnabled) ||
      (orderType === "market" && config.swapEnabled) ||
      orderType === "marketOrder"
    ) {
      return false;
    } else if ((orderType === "limit" && !config.limitEnabled) || (orderType === "market" && !config.swapEnabled)) {
      return true;
    }
  };
  const getQuoteCurrency = () => currentMarket?.split("-")[0];
  const renderBalance = () => {
    let baseBalance, quoteBalance;
    if (isUserConnected) {
      baseBalance = getBaseBalance();
      quoteBalance = getQuoteBalance();
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
    if (orderSide === "b") {
      return (
        <strong>
          {quoteBalance} {quoteCurrency}
        </strong>
      );
    }
    return (
      <strong>
        {baseBalance} {baseCurrency}
      </strong>
    );
  };

  const getBtnText = () => {
    if (orderSide === "b") {
      return "BUY";
    } else if (orderSide === "s") {
      return "SELL";
    }
  };
  const getClassName = () => {
    if (orderSide === "b") {
      return " buy_btn";
    } else if (orderSide === "s") {
      return " sell_btn";
    }
  };

  return (
    <>
      <form className="spot_form">
        <div className="spf_head">
          <span>Availabe balance</span>
          {renderBalance()}
        </div>
        <div className="spf_input_box">
          <span className="spf_desc_text">Price</span>
          <input
            type="text"
            value={
              orderType === "marketOrder"
                ? "Market"
                : !isNaN(getPrice()) && orderType !== "limit"
                  ? getPrice()
                  : selectedPrice > 0
                    ? selectedPrice
                    : order.price
            }
            placeholder="0.0000"
            onChange={updatePrice}
            disabled={priceIsDisabled()}
          />
          <span className={priceIsDisabled() ? "text-disabled" : ""}>{getSymbol(getPrice(), quoteCurrency)}</span>
        </div>
        <div className="spf_input_box">
          <span className="spf_desc_text">Amount</span>
          <input
            type="text"
            value={orderType === "limit" ? (rangePrice > 0 ? parseFloat(rangePrice) : order.amount) : order.amount}
            placeholder="0.0000"
            onChange={updateAmount}
          />
          <span>{baseCurrency}</span>
        </div>
        <div className="spf_range">
          <RangeSlider value={amountPercentOfMax()} onChange={rangeSliderHandler} />
        </div>
        <div className="spot_box_footer">
          <div className="connect-btn">
            {isUserConnected ? (
              <>
                <div className="spf_head_total_amount">
                  <span>{SpenderSide[orderSide]}</span>
                  <strong>
                    {orderType === "limit" ? (
                      <>
                        {rangePrice > 0 && selectedPrice
                          ? removeTrailingZeros(rangePrice * selectedPrice, 2)
                          : order.price || selectedPrice
                            ? removeTrailingZeros(currentPrice() * order.baseAmount, 2)
                            : parseFloat(0).toPrecision(6)}{" "}
                        {marketInfo.quote_asset_name}
                      </>
                    ) : (
                      <>
                        {(marketSummary.price * order.baseAmount).toPrecision(5)} {marketInfo.quote_asset_name}
                      </>
                    )}
                  </strong>
                </div>

                <OverlayTrigger
                  key={"top"}
                  placement="top"
                  overlay={<Tooltip id={"top"}>{renderFeesDetails()}</Tooltip>}>
                  <div key={"top"} className="spf_fee">
                    Fees <i className="icon-question-sign"></i>
                  </div>
                </OverlayTrigger>
              </>
            ) : null}
          </div>

          <div className="spf_btn">
            <button
              type="button"
              className={"bg_btn btn_fix " + getClassName()}
              onClick={HandleTrade}
              disabled={isTradeDisabled()}>
              {getBtnText()}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default SpotForm;
