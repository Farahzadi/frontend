import React, { useEffect, useState } from "react";
import { connect, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

import {
  configSelector,
  rangePriceSelector,
  selectedPriceSelector,
  userOrdersSelector,
  networkListSelector,
  networkSelector,
  networkConfigSelector,
  lastPricesSelector,
  orderSideSelector,
  allOrdersSelector,
  marketInfoSelector,
  liquiditySelector,
  userSelector,
  orderTypeSelector,
  currentMarketSelector,
  currencySelector,
  marketSummarySelector,
} from "lib/store/features/api/apiSlice";
import { RangeSlider, Button } from "components";
import "./SpotForm.css";
import Currencies from "config/Currencies";
import Core from "lib/api/Core";
import { removeTrailingZeros } from "lib/utils";
import { activeOrderStatuses, OrderSide, OrderSideKeyMap } from "lib/interface";

const numberRegex = /^[0-9]*\.?[0-9]*$/;
export const SpenderSide = {
  b: "Send",
  s: "Recieve",
};

const SpotForm = () => {
  const config = useSelector(configSelector);
  const rangePrice = useSelector(rangePriceSelector);
  const selectedPrice = useSelector(selectedPriceSelector);
  const userOrders = useSelector(userOrdersSelector);
  const networkList = useSelector(networkListSelector);
  const network = useSelector(networkSelector);
  const networkConfig = useSelector(networkConfigSelector);
  const orderSide = useSelector(orderSideSelector);
  const allOrders = useSelector(allOrdersSelector);
  const marketInfo = useSelector(marketInfoSelector);
  const liquidity = useSelector(liquiditySelector);
  const user = useSelector(userSelector);
  const orderType = useSelector(orderTypeSelector);
  const currentMarket = useSelector(currentMarketSelector);
  const [baseCurrency, quoteCurrency] = useSelector(currencySelector);
  const marketSummary = useSelector(marketSummarySelector);
  const activeLimitAndMarketOrders = Object.values(useSelector(userOrdersSelector)).filter(
    order => activeOrderStatuses.includes(order.status) && order.type === "l",
  );

  const activeSwapOrders = Object.values(useSelector(userOrdersSelector)).filter(
    order => activeOrderStatuses.includes(order.status) && order.type === "s",
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
  const getBaseBalance = () => {
    return user.availableBalances?.[baseCurrency]?.valueReadable ?? "0";
  };

  const getQuoteBalance = () => {
    return user.availableBalances?.[quoteCurrency]?.valueReadable ?? "0";
  };
  const rangeSliderHandler = (e, val) => {
    if (!user.address) return;
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
  const getOrders = () => {
    Object.filter = (obj, predicate) =>
      Object.keys(obj)
        .filter(key => predicate(obj[key]))
        .reduce((res, key) => {
          res[key] = obj[key];
          return res;
        }, {});

    let filltered = user.address ? Object.filter(allOrders, order => order.side === orderSide) : "";

    return filltered;
  };
  const currentPrice = () => {
    if (orderType === "limit" && order.price) return order.price;
    if (marketSummary.lastPrice) return +marketSummary.lastPrice.toPrecision(6);
    return 0;
  };
  const marketPrice = () => {
    if (orderType === "limit" && order.price) return order.price;
    if (orderType === "market") return currentPrice();

    let orders = Object.values(getOrders());
    let closestOrder,
      sum = 0,
      mOrders = [],
      bestPrice = 0;
    if (orders.length > 0 && order.amount) {
      if (orderSide === "b") {
        orders.sort((a, b) => {
          return b.price - a.price;
        });
        for (let i = 0; i < orders.length; i++) {
          if (orders[i].remaining >= order.amount) {
            closestOrder = orders[i];
            return !closestOrder ? 0 : closestOrder.price;
          } else if (sum <= order.amount) {
            sum += orders[i].remaining;
            mOrders.push(orders[i]);
          }
        }

        if (mOrders.length > 0) {
          bestPrice = Math.max(...mOrders.map(order => order.price));
          return !bestPrice ? 0 : bestPrice;
        }
      }
      if (orderSide === "s") {
        orders.sort((a, b) => {
          return a.price - b.price;
        });
        for (let i = 0; i < orders.length; i++) {
          if (orders[i].remaining > order.amount) {
            closestOrder = orders[i];
            return !closestOrder ? 0 : closestOrder.price;
          } else if (sum <= order.amount) {
            sum += orders[i].remaining;
            mOrders.push(orders[i]);
          }
        }

        if (mOrders.length > 0) {
          bestPrice = Math.min(...mOrders.map(order => order.price));
          return !bestPrice ? 0 : bestPrice;
        }
      }
    }

    return 0;
  };
  const HandleTrade = async e => {
    let amount, price, newstate, orderPendingToast;
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
      toast.warning("Dear user, there is no guarantee from us for your definite performance");
      sessionStorage.setItem("test", true);
    }

    if (activeLimitAndMarketOrders.length > 0) {
      if (orderType === "market") {
        toast.error("Your limit or market order should fill first");
        return;
      }
    }

    // price
    if (orderType === "market") {
      price = currentPrice();
    } else if (orderType === "marketOrder") {
      price = marketPrice();
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
      toast.error(err.message);
      return;
    }

    setFlags({ ...flags, orderButtonDisabled: true });
    setOrder({ ...order, price });

    orderPendingToast = toast.info("Order pending. Sign or Cancel to continue...");

    // send feeType for limit order (fee method)
    try {
      await Core.run("submitOrder", data);
    } catch (e) {
      console.log(e);
      toast.error(e.message);
    }

    toast.dismiss(orderPendingToast);

    setFlags({ ...flags, orderButtonDisabled: false });
  };

  const priceIsDisabled = () => {
    return orderType === "market" || orderType === "marketOrder";
  };

  const amountPercentOfMax = () => {
    if (!user.address) return 0;
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
    if (user.address) {
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
            {user.address ? (
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
                        {(marketSummary.price * order.baseAmount).toPrecision(5)} {" "} {marketInfo.quote_asset_name}
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
