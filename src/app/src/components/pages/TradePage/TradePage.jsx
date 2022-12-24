import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DefaultTemplate, TradeChart } from "components";
import Footer from "components/organisms/Footer/Footer";
import { FaDiscord, FaTelegramPlane, FaTwitter } from "react-icons/fa";
import { useHistory, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import TradeHead from "components/pages/TradePage/TradeHead/TradeHead";
import TradePriceTable from "components/pages/TradePage/TradePriceTable/TradePriceTable";
import TradePriceBtcTable from "components/pages/TradePage/TradePriceBtcTable/TradePriceBtcTable";
import TradePriceHeadSecond from "components/pages/TradePage/TradePriceHeadSecond/TradePriceHeadSecond";
import SpotBox from "components/pages/TradePage/SpotBox/SpotBox";
import {
  networkSelector,
  userOrdersSelector,
  userFillsSelector,
  allOrdersSelector,
  marketFillsSelector,
  lastPricesSelector,
  marketSummarySelector,
  marketInfoSelector,
  liquiditySelector,
  currentMarketSelector,
  setCurrentMarket,
  uuidSelector,
  resetData,
  providerStateSelector,
  userChainDetailsSelector,
  userSelector,
} from "lib/store/features/api/apiSlice";
import "./style.css";
import { getFillDetailsWithoutFee } from "lib/utils";
import Core from "lib/api/Core";
import networkManager from "../../../config/NetworkManager";

const TradePage = () => {
  const [marketDataTab, updateMarketDataTab] = useState("pairs");
  const [rangePrice, setRangePrice] = useState(0);
  const user = useSelector(userSelector);
  const network = useSelector(networkSelector);
  const providerState = useSelector(providerStateSelector);
  const currentMarket = useSelector(currentMarketSelector);
  const userOrders = useSelector(userOrdersSelector);
  const userFills = useSelector(userFillsSelector);
  const allOrders = useSelector(allOrdersSelector);
  const marketFills = useSelector(marketFillsSelector);
  const lastPrices = useSelector(lastPricesSelector);
  const marketSummary = useSelector(marketSummarySelector);
  const marketInfo = useSelector(marketInfoSelector);
  const liquidity = useSelector(liquiditySelector);
  const uuid = useSelector(uuidSelector);
  const dispatch = useDispatch();
  const lastPriceTableData = [];
  const markets = [];

  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (!uuid || !network || !networkManager.has(network, currentMarket))
      return;

    const sub = () => Core.run("subscribeToMarket", currentMarket);

    const core = Core.getInstance();

    if (core.ws.readyState !== WebSocket.OPEN) core.on("open", sub);
    else sub();

    Core.run("getOrderBook", currentMarket);
    Core.run("getMarketInfo", currentMarket);
    Core.run("getMarketConfig", currentMarket);

    return () => {
      core.off("open");
    };
  }, [uuid, currentMarket, network]);

  // useEffect(() => {
  //   if (uuid && providerState === APIProvider.State.CONNECTED)
  //     Core.run("connectWallet");
  // }, [uuid, network, providerState]);

  const updateMarketChain = (market) => {
    dispatch(setCurrentMarket(market));
  };

  const updateMarketForPriceTable = (market) => {
    dispatch(setCurrentMarket(market));
    window.scrollTo(0, 0);
  };

  Object.keys(lastPrices).forEach((market) => {
    //change this feild when NBX token is create
    if (market !== "DAI-USDT") {
      markets.push(market);
      const price = lastPrices[market].price;
      const change = lastPrices[market].change;
      const pctchange = ((change / price) * 100).toFixed(2);
      lastPriceTableData.push({ market, price, pctchange });
    }
  });

  const openOrdersData = [];

  //Only display recent trades
  //There's a bunch of user trades in this list that are too old to display
  const fillData = [];
  const maxFillId = Math.max(...Object.values(marketFills).map((f) => f.id));
  Object.values(marketFills)
    .filter((fill) => fill.id > maxFillId - 500)
    .sort((a, b) => b.id - a.id)
    .forEach((fill) => {
      if (fill.status !== "e" && fill.status !== "r" && fill.status !== "c") {
        if (["zksyncv1", "zksyncv1_goerli"].includes(network)) {
          const fillWithoutFee = getFillDetailsWithoutFee(fill);
          fillData.push({
            price: fillWithoutFee.price,
            remaining: fillWithoutFee.baseQuantity,
            quoteQuantity: fillWithoutFee.quoteQuantity,
            side: fill.takerSide,
            time: fillWithoutFee.time,
          });
        } else {
          fillData.push({
            price: fill.price,
            remaining: fill.amount,
            quoteQuantity: fill.price * fill.amount,
            side: fill.takerSide,
          });
        }
      }
    });

  let openOrdersLatestTradesData;
  let showMarketTable;
  if (marketDataTab === "orders") {
    openOrdersLatestTradesData = openOrdersData;
    showMarketTable = true;
  } else if (marketDataTab === "fills") {
    openOrdersLatestTradesData = fillData;
    showMarketTable = true;
  } else if (marketDataTab === "pairs") {
    showMarketTable = false;
  }

  const activeOrderStatuses = ["o", "m", "b"];

  const askBins =
    allOrders !== {}
      ? Object.values(allOrders)
          .filter((order) => order.side === "s")
          .reverse()
      : [];

  const bidBins =
    allOrders !== {}
      ? Object.values(allOrders)
          .filter((order) => order.side === "b")
          .reverse()
      : [];

  const activeLimitAndMarketOrders = Object.values(userOrders).filter(
    (order) => activeOrderStatuses.includes(order.status) && order.type === "l"
  );

  const activeSwapOrders = Object.values(userOrders).filter(
    (order) => activeOrderStatuses.includes(order.status) && order.type === "s"
  );

  let tradingViewMarket = currentMarket;
  const baseCurrency = currentMarket.split("-")[0];
  const quoteCurrency = currentMarket.split("-")[1];
  if (baseCurrency === "WBTC") tradingViewMarket = "BTC-" + quoteCurrency;
  if (quoteCurrency === "WBTC") tradingViewMarket = baseCurrency + "-BTC";

  return (
    <DefaultTemplate>
      <div className="trade_section">
        <div className="trade_container">
          <div className="pt-3 trade-Head">
            {/* Trade Head */}
            <TradeHead
              updateMarketChain={updateMarketChain}
              marketSummary={marketSummary}
              markets={markets}
              currentMarket={currentMarket}
            />
          </div>
          <div className="container-fluid pl-sm-1 pl-lg-0">
            <div className="row flex-column-reverse  flex-lg-row m-0">
              <div className="col-12 col-lg-5 px-0 px-lg-1">
                <div className="trade_right ">
                  <div className="row mt-1 my-lg-0 mx-0 w-100">
                    <div className="trade-price-container mt-1 my-lg-0  trade-tables-left col-12 col-lg-6 px-0 px-lg-1">
                      <div className="trades-details dexpresso-border d-none d-lg-block mb-1 bg_pannel">
                        <div className="trade-price ">
                          {/* <TradePriceBtcHead /> */}
                          <TradePriceBtcTable
                            lastPriceTableData={lastPriceTableData}
                            updateMarketChain={updateMarketForPriceTable}
                            currentMarket={currentMarket}
                          />
                        </div>
                      </div>

                      <div className=" spot_box_table dexpresso-border bg_pannel">
                        <SpotBox
                          className="dexpresso-border"
                          lastPrice={marketSummary.price}
                          loading={isLoading}
                          rangePrice={rangePrice}
                          setRangePrice={setRangePrice}
                          signInHandler={() => {
                            setIsLoading(true);
                            Core.run("connectWallet").finally(() =>
                              setIsLoading(false)
                            );
                          }}
                          user={user}
                          currentMarket={currentMarket}
                          activeLimitAndMarketOrders={
                            activeLimitAndMarketOrders
                          }
                          activeSwapOrdersCount={activeSwapOrders}
                          liquidity={liquidity}
                          marketSummary={marketSummary}
                          marketInfo={marketInfo}
                        />
                      </div>
                    </div>
                    <div className="col-12 col-lg-6 px-0 px-lg-1 trade-tables ">
                      <div className="order-boook-trades  bg_pannel">
                        <div className="trade-price-head-third">
                          <strong
                            className={
                              marketDataTab === "pairs"
                                ? "trade-price-active-tab"
                                : ""
                            }
                            onClick={() => updateMarketDataTab("pairs")}
                          >
                            Order Book
                          </strong>
                          <strong
                            className={
                              marketDataTab === "fills"
                                ? "trade-price-active-tab"
                                : ""
                            }
                            onClick={() => updateMarketDataTab("fills")}
                          >
                            Latest Trades
                          </strong>
                        </div>
                        {!showMarketTable && (
                          <div className="bids-trade-price-buy">
                            <div className="trade-price">
                              {/* Trade Price Table*/}
                              <TradePriceTable
                                className="trade_table_asks"
                                useGradient="true"
                                priceTableData={askBins}
                                itsAsks="true"
                                currentMarket={currentMarket}
                                scrollToBottom="true"
                                isSell="isSell"
                                setRangePrice={setRangePrice}
                                marketInfo={marketInfo}
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          {/* Trade Price Second Head */}
                          {marketDataTab !== "fills" ? (
                            <TradePriceHeadSecond
                              marketSummary={marketSummary}
                            />
                          ) : null}
                        </div>
                        {!showMarketTable && (
                          <div className="bids-trade-price-sell sell-book">
                            <div className="trade-price">
                              {/* Trade Price Table*/}
                              <TradePriceTable
                                className=" justify-content-start"
                                useGradient="true"
                                itsBids="true"
                                isBuy="isBuy"
                                currentMarket={currentMarket}
                                priceTableData={bidBins}
                                setRangePrice={setRangePrice}
                                marketInfo={marketInfo}
                              />
                              {/* <TradeMarketActivites /> */}
                            </div>
                          </div>
                        )}
                        {showMarketTable && (
                          <div className="trade-price trade-price-height  trade-price2">
                            {/* Trade Price Table*/}
                            <TradePriceTable
                              latestTrades="true"
                              className="justify-content-start"
                              value="up_value"
                              priceTableData={openOrdersLatestTradesData}
                              currentMarket={currentMarket}
                              marketDataTab={marketDataTab}
                              marketInfo={marketInfo}
                            />
                            {/* <TradePriceBtcHead /> */}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-7 px-0  trade-tables-right">
                <div className="trade_left dexpresso-border bg_pannel">
                  <div>
                    {/* Trade Chart */}
                    <TradeChart currentMarket={tradingViewMarket} />
                  </div>
                </div>
                {/* order table  */}
                <div className="m-auto user-info-container order dexpresso-border mt-1 bg_pannel  orders_table_lg">
                  <Footer
                    userFills={userFills}
                    userOrders={userOrders}
                    user={user}
                  />
                </div>
                {/* order table  */}
              </div>
            </div>

            <div className="m-auto user-info-container order dexpresso-border mt-1 bg_pannel orders_table_mobile ">
              <Footer
                userFills={userFills}
                userOrders={userOrders}
                user={user}
              />
            </div>
            <div className="footer-trade-tables d-flex flex-column flex-lg-row text-center justify-content-center justify-content-lg-around">
              <div className="mt-3 mt-lg-0 d-flex align-items-center justify-content-center">
                Powered By Dexpresso
              </div>
              <div className="mt-3 mt-lg-0 d-flex align-items-center justify-content-center">
                <p>v0.0.1</p>{" "}
              </div>
              <div className="head_left_socials my-1 my-lg-0 footer-icons">
                {" "}
                <ul>
                  <li className="head_social_link">
                    <a target="_blank" rel="noreferrer" href="#">
                      <FaTwitter />
                    </a>
                  </li>
                  <li className="head_social_link">
                    <a target="_blank" rel="noreferrer" href="#">
                      <FaTelegramPlane />
                    </a>
                  </li>
                  <li className="head_social_link">
                    <a target="_blank" rel="noreferrer" href="#">
                      <FaDiscord />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultTemplate>
  );
};
export default TradePage;
