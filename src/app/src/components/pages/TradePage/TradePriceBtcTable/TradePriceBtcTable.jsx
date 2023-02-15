import React from "react";
import updownIcon from "assets/icons/up-down-arrow.png";
import "./TradePriceBtcTable.css";
import { useDispatch, useSelector } from "react-redux";
import { currentMarketSelector, lastPricesSelector, setCurrentMarket } from "lib/store/features/api/apiSlice";

const TradePriceBtcTable = () => {
  const currentMarket = useSelector(currentMarketSelector);
  const lastPrices = useSelector(lastPricesSelector);
  const dispatch = useDispatch();

  const getMarketSummary = () => {
    let array = [];
    Object.keys(lastPrices).forEach(market => {
      //change this feild when NBX token is create
      if (market !== "DAI-USDT") {
        const price = lastPrices[market].price;
        const change = lastPrices[market].change;
        const pctchange = ((change / price) * 100).toFixed(2);
        array.push({ market, price, pctchange });
      }
    });
    return array;
  };
  const updateMarketChain = market => {
    dispatch(setCurrentMarket(market));
  };
  return (
    <>
      <div className="trade_page_market">
        <table>
          <thead>
            <tr>
              <th>
                Pair
                <img className="ms-2" src={updownIcon} alt="..." />
              </th>
              <th>
                Price
                <img className="ms-2" src={updownIcon} alt="..." />
              </th>
              <th>
                Change
                <img className="ms-2" src={updownIcon} alt="..." />
              </th>
            </tr>
          </thead>
          <tbody>
            {getMarketSummary().map((data, i) => {
              return (
                <tr
                  key={i}
                  onClick={e => updateMarketChain(data.market)}
                  className={currentMarket === data.market ? "selected" : ""}>
                  <td>
                    {data.market.replace("-", "/")}
                    <span>{data.span}</span>
                  </td>
                  <td className={data.pctchange < 0 ? "down_value" : "up_value"}>{data.price}</td>
                  <td className={data.pctchange < 0 ? "down_value" : "up_value"}>{data.pctchange}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TradePriceBtcTable;
