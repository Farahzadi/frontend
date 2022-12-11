import React from "react";
// css
import "./TradePriceTable.css";

import { connect } from "react-redux";
import { numStringToSymbol } from "lib/utils";
import api from "lib/api";
import Tooltip from "@mui/material/Tooltip";
import { Fade } from "@mui/material";
import {
  setOrderType,
  orderTypeSelector,
  allOrdersSelector,
  userAddressSelector,
  orderSideSelector,
} from "lib/store/features/api/apiSlice";

class TradePriceTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rengId: -1,
      rangedData: 0,
      selectedPrice: 0,
      isScrolled: false,
    };
  }
  scrollToBottom = () => {
    if (this.props.scrollToBottom) {
      this.tableDiv.scrollTop = this.tableDiv.scrollHeight;
    }
  };
  tooltipStyle = {
    background: "#5e35b1b5",
    color: "white",
    width: "250px",
    height: "35px",
    display: "flex",
    zIndex: "1000",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 0px 15px 0px #5e35b1",
  };

  rangeUi(id) {
    let selectedPrice,
      newRangeData = 0.0;

    if (this.props.latestTrades) {
      return null;
    }
    const newState = { ...this.state };
    newState.rengId = id;
    for (let i = 0; i <= id; i++) {
      newRangeData += this.props.priceTableData[i].remaining;
      selectedPrice = this.props.priceTableData[i].price;
    }
    newState.rangedData = newRangeData.toPrecision(6);
    newState.selectedPrice = parseFloat(selectedPrice)
      .toFixed(2)
      .replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, "$1");

    this.setState(newState);
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.priceTableData.length !== prevProps.priceTableData.length ||
      this.state.isScrolled === false
    ) {
      this.scrollToBottom();
      this.setState({ isScrolled: true });
    }
  }
  setRangedPrice() {
    if (!this.props.latestTrades) {
      api.emit("rangePrice", this.state.rangedData);
      api.emit("selectedPrice", this.state.selectedPrice);
      this.updateOrderType("limit");
      if (this.props.itsAsks) {
        api.emit("orderSide", true);
      }
      if (this.props.itsBids) {
        api.emit("orderSide", false);
      }
    }
  }
  updateOrderType(orderType) {
    const { setOrderType } = this.props;
    setOrderType(orderType);
  }

  render() {
    const quoteCurrency = this.props.currentMarket.split("-")[1];

    const maxQuantity = Math.max(
      ...this.props.priceTableData.map((data) => data.remaining)
    );
    let onClickRow;
    if (this.props.onClickRow) onClickRow = this.props.onClickRow;
    else onClickRow = () => null;

    return (
      <>
        <div
          className={`trade-price-table ${this.props.className}`}
          ref={(el) => (this.tableDiv = el)}
        >
          <div className="mb-4 trade_table_asks_head">
            {!this.props.isBuy ? (
              <div className="d-flex flex-wrap text-white ">
                <div className="table-head">
                  {this.props.marketDataTab === "fills" ? (
                    <p>Time</p>
                  ) : (
                    <p>Price</p>
                  )}
                </div>
                <div className="table-head align-center">
                  {this.props.marketDataTab === "fills" ? (
                    <p>Price</p>
                  ) : (
                    <p>Amount</p>
                  )}
                </div>
                <div className="table-head align-right">
                  <p>Total ({quoteCurrency})</p>
                </div>
              </div>
            ) : (
              ""
            )}
          </div>

          <div
            className={
              this.props.isSell === "isSell" ? "flex-column-reverse d-flex" : ""
            }
          >
            {this.props.latestTrades &&
              this.props.priceTableData.map((data, i) => {
                const color = data.side === "b" ? "#27302F" : "#2C232D";
                const breakpoint = Math.round(
                  (data.remaining / maxQuantity) * 100
                );
                let rowStyle;
                if (this.props.useGradient) {
                  rowStyle = {
                    backgroundImage: `linear-gradient(to left, ${color}, ${color} ${breakpoint}%, #14243C 0%)`,
                  };
                } else {
                  rowStyle = {};
                }
                const price =
                  typeof data.price === "number"
                    ? data.price.toPrecision(6)
                    : Number(data.price).toPrecision(6);
                const total = (
                  Number(data.price) * Number(data.remaining)
                ).toFixed(5);
                const time = data.time;
                return (
                  <div
                    key={i}
                    style={rowStyle}
                    className={` ${i <= this.state.rengId ? "bg-range" : ""}
                 table-section`}
                    onClick={() => {
                      onClickRow(data);
                      this.setRangedPrice();
                    }}
                    onMouseEnter={() => this.rangeUi(i)}
                    onMouseLeave={() => this.rangeUi(-1)}
                  >
                    <div>{time}</div>
                    <div
                      className={data.side === "b" ? "up_value" : "down_value"}
                    >
                      {price}
                    </div>
                    <div>{numStringToSymbol(total, 2)}</div>
                  </div>
                );
              })}
            {!this.props.latestTrades &&
              this.props.priceTableData.map((data, i) => {
                const color = data.side === "b" ? "#27302F" : "#2C232D";
                const breakpoint = Math.round(
                  (data.remaining / maxQuantity) * 100
                );
                let rowStyle;
                if (this.props.useGradient) {
                  rowStyle = {
                    backgroundImage: `linear-gradient(to left, ${color}, ${color} ${breakpoint}%, #14243C 0%)`,
                  };
                } else {
                  rowStyle = {};
                }
                const price =
                  typeof data.price === "number"
                    ? data.price.toPrecision(6)
                    : Number(data.price).toPrecision(6);
                const amount =
                  typeof data.remaining === "number"
                    ? data.remaining.toFixed(5)
                    : Number(data.remaining).toFixed(5);
                const total = (
                  Number(data.price) * Number(data.remaining)
                ).toFixed(5);
                return (
                  <Tooltip
                    arrow
                    key={i}
                    followCursor
                    style={this.tooltipStyle}
                    TransitionComponent={Fade}
                    TransitionProps={{ timeout: 0 }}
                    title={
                      <div className={this.props.latestTrades ? "d-none" : ""}>
                        <h6>
                          <strong>
                            ◄ Total Amount ≈ {this.state.rangedData}
                          </strong>
                        </h6>
                      </div>
                    }
                    placement="right"
                  >
                    <div
                      key={i}
                      style={rowStyle}
                      className={` ${i <= this.state.rengId ? "bg-range" : ""}
                  table-section`}
                      onClick={() => {
                        onClickRow(data);
                        this.setRangedPrice();
                      }}
                      onMouseEnter={() => this.rangeUi(i)}
                      onMouseLeave={() => this.rangeUi(-1)}
                    >
                      <div
                        className={
                          data.side === "b" ? "up_value" : "down_value"
                        }
                      >
                        {price}
                      </div>
                      <div>{numStringToSymbol(amount, 2)}</div>
                      <div>{numStringToSymbol(total, 2)}</div>
                    </div>
                  </Tooltip>
                );
              })}
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

export default connect(mapStateToProps, { setOrderType })(TradePriceTable);
