import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DefaultTemplate, TradeChart } from "components";
// import Footer from "components/organisms/Footer/Footer";
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
  allOrdersSelector,
  marketFillsSelector,
  marketInfoSelector,
  currentMarketSelector,
  setCurrentMarket,
  uuidSelector,
  marketSummarySelector,
} from "lib/store/features/api/apiSlice";
import "./style.css";
import { getFillDetailsWithoutFee } from "lib/utils";
import Core from "lib/api/Core";
import networkManager from "../../../config/NetworkManager";
import OrderHistory from "components/organisms/OrderHistory/OrderHistory";
import Footer from "components/organisms/Footer/Footer";

const TradePage = () => {
  const [marketDataTab, updateMarketDataTab] = useState("pairs");
  const [isLoading, setIsLoading] = useState(false);
  const [rangePrice, setRangePrice] = useState(0);
  const network = useSelector(networkSelector);
  const currentMarket = useSelector(currentMarketSelector);
  const allOrders = useSelector(allOrdersSelector);
  const marketFills = useSelector(marketFillsSelector);
  const marketInfo = useSelector(marketInfoSelector);
  const uuid = useSelector(uuidSelector);
  const marketSummary = useSelector(marketSummarySelector);

  useEffect(() => {
    const { market, price } = marketSummary;
    if (price && market) {
      // document.title = `$ ${price} | ${market} | Dexpresso`;
      document.title = "Dexpresso";
    } else document.title = "Dexpresso";
  }, [marketSummary]);

  useEffect(() => {
    if (!uuid || !network || !networkManager.has(network, currentMarket)) return;

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

  const openOrdersData = [];

  //Only display recent trades
  //There"s a bunch of user trades in this list that are too old to display
  const fillData = [];
  const liveOrderStatuses = ["e", "r", "c"];
  const maxFillId = Math.max(...Object.values(marketFills).map(f => f.id));
  Object.values(marketFills)
    .filter(fill => fill.id > maxFillId - 500)
    .sort((a, b) => b.id - a.id)
    .forEach(fill => {
      if (!liveOrderStatuses.includes(fill.status)) {
        const fillWithoutFee = getFillDetailsWithoutFee(fill);
        fillData.push({
          price: fillWithoutFee.price,
          remaining: fillWithoutFee.baseQuantity,
          quoteQuantity: fillWithoutFee.quoteQuantity,
          side: fill.takerSide,
          time: fillWithoutFee.time,
        });
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

  const askBins =
    allOrders !== {}
      ? Object.values(allOrders)
        .filter(order => order.side === "s")
        .reverse()
      : [];

  const bidBins =
    allOrders !== {}
      ? Object.values(allOrders)
        .filter(order => order.side === "b")
        .reverse()
      : [];

  return (
    <DefaultTemplate>
      <div className="trade_section">
        <div className="trade_container">
          <div className="pt-3 trade-Head">
            {/* Trade Head */}
            <TradeHead />
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
                          <TradePriceBtcTable />
                        </div>
                      </div>

                      <div className=" spot_box_table dexpresso-border bg_pannel">
                        <SpotBox
                          className="dexpresso-border"
                          loading={isLoading}
                          rangePrice={rangePrice}
                          setRangePrice={setRangePrice}
                        />
                      </div>
                    </div>
                    <div className="col-12 col-lg-6 px-0 px-lg-1 trade-tables ">
                      <div className="order-boook-trades  bg_pannel">
                        <div className="trade-price-head-third">
                          <strong
                            className={marketDataTab === "pairs" ? "trade-price-active-tab" : ""}
                            onClick={() => updateMarketDataTab("pairs")}>
                            Order Book
                          </strong>
                          <strong
                            className={marketDataTab === "fills" ? "trade-price-active-tab" : ""}
                            onClick={() => updateMarketDataTab("fills")}>
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
                          {marketDataTab !== "fills" ? <TradePriceHeadSecond /> : null}
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
                    <TradeChart />
                  </div>
                </div>
                {/* order table  */}
                <div className="m-auto user-info-container order dexpresso-border mt-1 bg_pannel  orders_table_lg">
                  <OrderHistory />
                </div>
                {/* order table  */}
              </div>
            </div>

            <div className="m-auto user-info-container order dexpresso-border mt-1 bg_pannel orders_table_mobile ">
              <OrderHistory />
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </DefaultTemplate>
  );
};
export default Tra;
