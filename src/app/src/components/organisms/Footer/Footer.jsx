import React from "react";
import { connect } from "react-redux";
import Decimal from "decimal.js";

import "./Footer.css";
import loadingGif from "assets/icons/loading.svg";
import api from "lib/api";
import {
  currentMarketSelector,
  unbroadcastedSelector,
  lastPricesSelector,
  userAddressSelector,
  networkSelector,
} from "lib/store/features/api/apiSlice";
import { Modal } from "../../atoms/Modal";

class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tab: "orders",
      openModal: false,
    };
  }

  handleOpen = () => this.setState({ openModal: true });
  handleClose = () => this.setState({ openModal: false });
  static activeFillStatus = ["m", "b", "f", "r", "e"];
  static activeOrderStatus = ["c", "r", "e", "f"];

  setTab(value) {
    this.setState({ tab: value });
  }

  getFills() {
    let fills = Object.values(this.props.userFills).sort((a, b) => b.id - a.id);
    return fills.filter((fill) => {
      return Footer.activeFillStatus.includes(fill.status);
    });
  }

  getUserOrders() {
    let orders = Object.values(this.props.userOrders).sort(
      (a, b) => b.id - a.id
    );
    return orders.filter((order) => {
      return (
        !Footer.activeOrderStatus.includes(order.status) &&
        order.market === this.props.currentMarket
      );
    });
  }

  getOrderHistory() {
    let orders = Object.values(this.props.userOrders)
      .slice(-25)
      .sort((a, b) => b.id - a.id);
    return orders.filter((order) => {
      return order.status !== "o";
    });
  }

  getOpenOrders() {
    let orders = this.getUserOrders();
    return orders.filter((order) => {
      return order.status === "o";
    });
  }
  setShowModal = () => {
    const newState = { ...this.state };
    newState.showModal = !newState.showModal;
    this.setState(newState);
  };
  renderOrderTable(orders) {
    return (
      <table>
        <thead>
          <tr>
            <th scope="col">Market</th>
            <th scope="col">Type</th>
            <th scope="col">Price</th>
            <th scope="col">Volume</th>
            <th scope="col">Remaining</th>
            <th scope="col">Side</th>
            <th scope="col">Expiry</th>
            <th scope="col">Status</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => {
            const orderId = order.id;
            const market = order.market;
            let price = order.price;
            let baseQuantity = order.baseQuantity;
            let remaining = isNaN(Number(order.remaining))
              ? order.baseQuantity
              : order.remaining;
            const orderStatus = order.status;
            const baseCurrency = order.market.split("-")[0];
            const side = order.side === "b" ? "buy" : "sell";
            const sideClassName =
              order.side === "b" ? "up_value" : "down_value";
            const expiration = order.expires;
            const orderType = order.type;
            const now = (Date.now() / 1000) | 0;
            const timeToExpiry = expiration - now;

            let expiryText;
            if (timeToExpiry > 86400) {
              expiryText = Math.floor(timeToExpiry / 86400) + "d";
            } else if (timeToExpiry > 3600) {
              expiryText = Math.floor(timeToExpiry / 3600) + "h";
            } else if (timeToExpiry > 60) {
              expiryText = Math.floor(timeToExpiry / 60) + "m";
            } else if (timeToExpiry > 0) {
              expiryText = Math.floor(timeToExpiry) + "s";
            } else {
              expiryText = "--";
            }

            const orderWithoutFee = api.getOrderDetailsWithoutFee(order);
            if (api.isZksyncChain()) {
              price = orderWithoutFee.price;
              baseQuantity = orderWithoutFee.baseQuantity;
              remaining = orderWithoutFee.remaining;
            }
            let statusText, statusClass;
            switch (orderStatus) {
              case "r":
                statusText = "rejected";
                statusClass = "rejected";
                break;
              case "pf":
                statusText = "partial fill";
                statusClass = "filled";
                break;
              case "f":
                statusText = "filled";
                statusClass = "filled";
                break;
              case "pm":
                statusText = (
                  <span>
                    partial match
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "matched";
                break;
              case "m":
                statusText = (
                  <span>
                    matched{" "}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "matched";
                break;
              case "b":
                statusText = (
                  <span>
                    committing{" "}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "committing";
                break;
              case "o":
                statusText = "open";
                statusClass = "open";
                break;
              case "c":
                statusText = "canceled";
                statusClass = "canceled";
                break;
              case "e":
                statusText = "expired";
                statusClass = "expired";
                break;
              default:
                break;
            }

            return (
              <tr key={orderId}>
                <td data-label="Market">{market}</td>
                <td data-label="Order Type">
                  {orderType === "l"
                    ? "limit"
                    : orderType === "m"
                    ? "market"
                    : "swap"}
                </td>
                <td data-label="Price">{price.toPrecision(6) / 1}</td>
                <td data-label="Quantity">
                  {baseQuantity.toPrecision(6) / 1} {baseCurrency}
                </td>
                <td data-label="Remaining">
                  {orderStatus === "b" ? ".." : remaining.toPrecision(6) / 1}
                  {baseCurrency}
                </td>
                <td className={sideClassName} data-label="Side">
                  {side}
                </td>
                {orderStatus !== "f" && orderStatus !== "c" ? (
                  <td data-label="Expiry">{expiryText}</td>
                ) : (
                  <td>
                    <p>--</p>
                  </td>
                )}
                <td
                  className={
                    this.props.unbroadcasted !== baseQuantity &&
                    orderStatus !== "m" &&
                    orderStatus !== "o" &&
                    orderStatus !== "b"
                      ? orderStatus !== "f" && orderStatus === "mf"
                        ? "filled"
                        : statusClass
                      : statusClass
                  }
                  data-label="Order Status"
                >
                  {this.props.unbroadcasted !== baseQuantity &&
                  orderStatus !== "m" &&
                  orderStatus !== "o" &&
                  orderStatus !== "b"
                    ? orderStatus !== "f" && orderStatus === "mf"
                      ? "partial fill"
                      : statusText
                    : statusText}
                </td>
                {orderStatus === "o" ||
                (orderStatus === "pm" && remaining > 0) ? (
                  <td data-label="Action">
                    <span
                      className="cancel_order_link"
                      onClick={() => api.cancelOrder(orderId)}
                    >
                      Cancel
                    </span>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  renderFillTable(fills) {
    let baseExplorerUrl;
    switch (this.props.network) {
      // case 1001:
      //   baseExplorerUrl = "https://goerli.voyager.online/tx/";
      //   break;
      case "zksyncv1_goerli":
        baseExplorerUrl = "https://goerli.zkscan.io/explorer/transactions/";
        break;
      case "zksyncv1":
      default:
        baseExplorerUrl = "https://zkscan.io/explorer/transactions/";
    }
    return (
      <table>
        <thead>
          <tr>
            <th scope="col">Market</th>
            <th scope="col">Time</th>
            <th scope="col">Price</th>
            <th scope="col">Volume</th>
            <th scope="col">Side</th>
            <th scope="col">Fee</th>
            <th scope="col">Status</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {fills.map((fill, i) => {
            let date;
            const fillid = fill.id;
            const market = fill.market;
            const isTaker = fill.isTaker;
            let price = fill.price;
            let amount = new Decimal(fill.amount);
            const side = (fill.takerSide === "b") ^ !isTaker ? "b" : "s";
            const fillstatus = fill.status;
            const baseCurrency = fill.market.split("-")[0];
            const quoteCurrency = fill.market.split("-")[1];
            const sidetext = side === "s" ? "sell" : "buy";
            const sideClassName = side === "b" ? "up_value" : "down_value";
            const txHash = fill.txHash;
            const time = fill.insertTimestamp;
            const quantity = amount.mul(price);

            let fee = new Decimal(isTaker ? fill.takerFee : fill.makerFee);
            fee.mul(side === "b" ? quantity : amount);

            const feeCurrency = side === "b" ? quoteCurrency : baseCurrency;

            date = api.hasOneDayPassed(time);

            let feeText;

            if (!api.isZksyncChain()) feeText = "0 " + baseCurrency;
            else feeText = fee.toPrecision(3) + " " + feeCurrency;

            const fillWithoutFee = api.getFillDetailsWithoutFee(fill);
            if (api.isZksyncChain()) {
              price = fillWithoutFee.price;
              amount = fillWithoutFee.baseQuantity;
            }
            let statusText, statusClass;
            switch (fillstatus) {
              case "f":
                statusText = "filled";
                statusClass = "filled";
                break;
              case "m":
                statusText = (
                  <span>
                    matched{" "}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "matched";
                break;
              case "b":
                statusText = (
                  <span>
                    committing{" "}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "committing";
                break;
              case "r":
                statusText = "rejected";
                statusClass = "rejected";
                break;
              case "e":
                statusText = "expired";
                statusClass = "expired";
                break;
              default:
                break;
            }

            return (
              <tr key={fillid}>
                <td data-label="Market">{market}</td>
                <td data-label="Time">{date}</td>
                <td data-label="Price">{price.toPrecision(6) / 1}</td>
                <td data-label="Quantity">
                  {amount.toPrecision(6) / 1} {baseCurrency}
                </td>
                <td className={sideClassName} data-label="Side">
                  {sidetext}
                </td>
                <td data-label="Fee">{feeText}</td>
                <td className={statusClass} data-label="Order Status">
                  {statusText}
                </td>
                <td data-label="Action">
                  {txHash ? (
                    <a
                      href={baseExplorerUrl + txHash}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Tx
                    </a>
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  renderOrderHistoryTable(orders) {
    return (
      <table>
        <thead>
          <tr>
            <th scope="col">Market</th>
            <th scope="col">Type</th>
            <th scope="col">Time</th>
            <th scope="col">Price</th>
            <th scope="col">Volume</th>
            <th scope="col">Side</th>
            <th scope="col">Order Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            let date;
            const orderId = order.id;
            const market = order.market;
            const side = order.side;
            let price = order.price;
            let baseQuantity = order.baseQuantity;
            const orderStatus = order.status;
            const orderType = order.type;
            const time = order.insertTimestamp;
            const baseCurrency = market.split("-")[0];
            const sidetext = side === "s" ? "sell" : "buy";
            const sideClassName = side === "b" ? "up_value" : "down_value";

            date = api.hasOneDayPassed(time);

            const orderWithoutFee = api.getOrderDetailsWithoutFee(order);
            if (api.isZksyncChain()) {
              price = orderWithoutFee.price;
              baseQuantity = orderWithoutFee.baseQuantity;
            }
            let statusText, statusClass;
            switch (orderStatus) {
              case "r":
                statusText = "rejected";
                statusClass = "rejected";
                break;
              case "pf":
                statusText = "partial fill";
                statusClass = "filled";
                break;
              case "f":
                statusText = "filled";
                statusClass = "filled";
                break;
              case "pm":
                statusText = (
                  <span>
                    partial match
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "matched";
                break;
              case "m":
                statusText = (
                  <span>
                    matched{" "}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "matched";
                break;
              case "b":
                statusText = (
                  <span>
                    committing{" "}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "committing";
                break;
              case "c":
                statusText = "canceled";
                statusClass = "canceled";
                break;
              case "e":
                statusText = "expired";
                statusClass = "expired";
                break;
              default:
                break;
            }

            return (
              <tr key={orderId}>
                <td data-label="Market">{market}</td>
                <td data-label="Order Type">
                  {orderType === "l"
                    ? "limit"
                    : orderType === "m"
                    ? "market"
                    : "swap"}
                </td>
                <td data-label="Time">{date}</td>
                <td data-label="Price">{price.toPrecision(6) / 1}</td>
                <td data-label="Quantity">
                  {baseQuantity.toPrecision(6) / 1} {baseCurrency}
                </td>
                <td className={sideClassName} data-label="Side">
                  {sidetext}
                </td>
                <td
                  className={
                    this.props.unbroadcasted !== baseQuantity &&
                    orderStatus !== "m" &&
                    orderStatus !== "o" &&
                    orderStatus !== "b"
                      ? orderStatus === "pm"
                        ? "filled"
                        : statusClass
                      : statusClass
                  }
                  data-label="Order Status"
                >
                  {this.props.unbroadcasted !== baseQuantity &&
                  orderStatus !== "m" &&
                  orderStatus !== "o" &&
                  orderStatus !== "b"
                    ? orderStatus === "pm"
                      ? "filled"
                      : statusText
                    : statusText}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  render() {
    let explorerLink;
    switch (this.props.network) {
      case "zksyncv1_goerli":
        explorerLink =
          "https://goerli.zkscan.io/explorer/accounts/" +
          this.props.user.address;
        break;
      case "zksyncv1":
      default:
        explorerLink =
          "https://zkscan.io/explorer/accounts/" + this.props.user.address;
    }
    let footerContent,
      classNameOrders = "",
      classNameBalances = "",
      classNameFills = "",
      classNameHistory = "";
    switch (this.state.tab) {
      case "orders":
        footerContent = this.renderOrderTable(this.getUserOrders());
        classNameOrders = "selected";
        break;
      case "fills":
        footerContent = this.renderFillTable(this.getFills());
        classNameFills = "selected";
        break;
      case "history":
        footerContent = this.renderOrderHistoryTable(this.getOrderHistory());
        classNameHistory = "selected";
        break;
      case "balances":
        if (this.props.user.committed) {
          const balancesContent = Object.keys(
            this.props.user.committed.balances
          )
            .sort()
            .map((token) => {
              if (!api.currencies[token]) return "";
              let balance = this.props.user.committed.balances[token];
              balance =
                parseInt(balance).toPrecision(6) /
                Math.pow(10, api.currencies[token].decimals);
              return (
                <tr>
                  <td data-label="Token">{token}</td>
                  <td data-label="Balance">{balance}</td>
                </tr>
              );
            });
          footerContent = (
            <div>
              <table className="balances_table">
                <thead>
                  <tr>
                    <th scope="col">Token</th>
                    <th scope="col">Balance</th>
                  </tr>
                </thead>
                <tbody>{balancesContent}</tbody>
              </table>

              <a href={explorerLink} target="_blank" rel="noreferrer">
                View Account on Explorer
              </a>
            </div>
          );
        } else {
          footerContent = (
            <div>
              <a href={explorerLink} target="_blank" rel="noreferrer">
                View Account on Explorer
              </a>
            </div>
          );
        }
        classNameBalances = "selected";
        break;
      default:
        break;
    }

    return (
      <>
        <Modal
          show={this.state.openModal}
          actionText="Yes"
          closeText="No"
          alert={"Are you sure you want to delete all orders?"}
          onClose={this.handleClose}
          onSubmit={() => {
            this.handleClose();
            api.cancelAllOrders();
          }}
        ></Modal>
        <div className="user-info">
          <div className="user-info-container ">
            <div>
              <div className="ft_tabs">
                <strong
                  className={classNameOrders}
                  onClick={() => this.setTab("orders")}
                >
                  Open Orders ({this.getUserOrders().length})
                </strong>
                <strong
                  className={classNameFills}
                  onClick={() => this.setTab("fills")}
                >
                  Trade History ({this.getFills().length})
                </strong>
                <strong
                  className={classNameHistory}
                  onClick={() => this.setTab("history")}
                >
                  Order History ({this.getOrderHistory().length})
                </strong>
                <strong
                  className={classNameBalances}
                  onClick={() => this.setTab("balances")}
                >
                  Assets
                </strong>
                {this.getOpenOrders().length > 1 ? (
                  <button
                    className="cancel-all-order"
                    onClick={() => {
                      this.handleOpen();
                    }}
                  >
                    cancel all order
                  </button>
                ) : null}
              </div>
            </div>
            <div className="user-info-orders">{footerContent}</div>
          </div>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  currentMarket: currentMarketSelector(state),
  unbroadcasted: unbroadcastedSelector(state),
  lastPrices: lastPricesSelector(state),
  userAddress: userAddressSelector(state),
  network: networkSelector(state),
});

export default connect(mapStateToProps)(Footer);
