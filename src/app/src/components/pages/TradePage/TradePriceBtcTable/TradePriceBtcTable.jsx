import React from "react";
import updownIcon from "assets/icons/up-down-arrow.png";
import "./TradePriceBtcTable.css";

class TradePriceBtcTable extends React.Component {

  render() {
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
              {this.props.lastPriceTableData.map((data, i) => {
                return (
                  <tr
                    key={i}
                    onClick={e => this.props.updateMarketChain(data.market)}
                    className={this.props.currentMarket === data.market ? "selected" : ""}>
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
  }

}

export default TradePriceBtcTable;
