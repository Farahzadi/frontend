import { createSlice, createAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import api from "lib/api";

const makeScope = (state) => `${state.network}-${state.userId}`;

const translators = {

  // used for both initial orders and order updates
  userOrder: o => ({
    chainId:          o.chain_id,
    id:               o.id,
    market:           o.market,
    side:             o.side,
    price:            + o.price,
    baseQuantity:     + o.base_quantity,
    quoteQuantity:    + o.quote_quantity,
    expires:          o.expiration,
    userId:           o.user_id,
    status:           o.status,
    remaining:        o.unfilled,
    type:             o.type,
    insertTimestamp:  o.created_at,
    unbroadcasted:    o.unbroadcasted,
    makerFee:         + o.maker_fee,
    takerFee:         + o.taker_fee,
    txHash:           o.tx_hash,
  }),

  orderBook: o => ({
    price:            + o.price,
    remaining:        + o.base_quantity,
    side:             o.side,
  }),

  // used for both initial fills and fill updates
  fills: f => ({
    chainId:          f.chain_id,
    id:               f.id,
    market:           f.market,
    takerSide:        f.taker_side,
    price:            + f.price,
    amount:           + f.amount,
    status:           f.status,
    txHash:           f.tx_hash,
    takerUserId:      f.taker_user_id,
    makerUserId:      f.maker_user_id,
    type:             f.type,
    takerOrderId:     f.taker_order_id,
    makerOrderId:     f.maker_order_id,
    insertTimestamp:  f.created_at,
    makerFee:         + f.maker_fee,
    takerFee:         + f.taker_fee,
    error:            f.error, // tx rejection error message
  }),

}

export const apiSlice = createSlice({
  name: "api",
  initialState: {
    network: 1000,
    userId: null,
    currentMarket: "ETH-DAI",
    config: {},
    marketFills: {},
    bridgeReceipts: [],
    bridgeReceiptsStatus: [],
    lastPrices: {},
    marketSummary: {},
    marketinfo: {},
    balances: {},
    liquidity: [],
    userOrders: {},
    userFills: {},
    orders: {},
    orderType: "limit",
    unbroadcasted: null,
    rangePrice: 0,
    selectedPrice: 0,
    orderSide: false,
  },
  reducers: {
    _config(state, { payload }) {
      state.config = {
        limitEnabled: payload[0].limitEnabled,
        swapEnabled: payload[0].swapEnabled,
        makerFee: payload[0].makerFee,
        takerFee: payload[0].takerFee,
        swapFee: payload[0].swapFee,
        minMatchAmount: payload[0].minMatchAmount,
      };
    },
    _swapfills(state, { payload }) {
      payload[0].forEach((fill) => {
        const fillid = fill.id;
        if (
          fill.market === state.currentMarket &&
          fill.chainId === state.network
        ) {
          state.marketFills[fillid] = fill;
        }
        state.userFills[fillid] = fill;
      });
    },
    _fills(state, { payload }) {
      payload[0].map(translators.fills).forEach((fill) => {
        const fillid = fill.id;
        if (
          fill.market === state.currentMarket &&
          fill.chainId === state.network
        ) {
          state.marketFills[fillid] = fill;
        }
        if (
          state.userId &&
          (fill.takerUserId === state.userId.toString() ||
            fill.makerUserId === state.userId.toString())
        ) {
          state.userFills[fillid] = { ...fill, isTaker: fill.takerUserId === state.userId.toString() };
        }
      });
    },
    _fillstatus(state, { payload }) {
      payload[0].map(translators.fills).forEach((update) => {
        let transactionHash;
        const fillId = update.id;
        const newStatus = update.status;

        if (update.txHash) transactionHash = update.txHash;
        if (state.marketFills[fillId]) {
          state.marketFills[fillId].status = newStatus;
          if (transactionHash)
            state.marketFills[fillId].txHash = transactionHash;
        }
        if (state.userFills[fillId]) {
          state.userFills[fillId].status = newStatus;
          if (transactionHash) state.userFills[fillId].txHash = transactionHash;
        }
      });
    },
    _marketsummary(state, { payload }) {
      state.marketSummary = {
        market: payload.market,
        price: payload.price,
        "24hi": payload.highPrice,
        "24lo": payload.lowPrice,
        priceChange: payload.priceChange,
        baseVolume: payload.baseVolume,
        quoteVolume: payload.quoteVolume,
      };
    },
    _marketinfo(state, { payload }) {
      if (payload[0].error) {
        console.error(payload[0]);
      } else {
        state.marketinfo = payload[0];
      }
    },
    _lastprice(state, { payload }) {
      payload[0].forEach((update) => {
        const marketPair = update.market;
        const lastPrice = update.lastPrice;
        const change = update.change;

        if (api.validMarkets[state.network].includes(marketPair)) {
          state.lastPrices[marketPair] = {
            price: lastPrice,
            change,
          };
        } else {
          delete state.lastPrices[marketPair];
        }
        if (marketPair === state.currentMarket) {
          state.marketSummary.price = lastPrice;
          state.marketSummary.priceChange = change;
          state.marketSummary["24hi"] = update.highPrice;
          state.marketSummary["24lo"] = update.lowPrice;
          state.marketSummary.baseVolume = update.baseVolume;
          state.marketSummary.quoteVolume = update.quoteVolume;
        }
      });
    },
    _liquidity(state, { payload }) {
      state.liquidity = state.liquidity.concat(payload[2]);
    },
    _orderstatus(state, { payload }) {
      (payload[0] || []).map(translators.userOrder).forEach(async (update) => {
        let filledOrder, partialmatchorder;
        switch (update.status) {
          case "c":
            delete state.orders[update.id];
            if (state.userOrders[update.id]) {
              state.userOrders[update.id].status = "c";
            }
            break;
          case "pm":
            partialmatchorder = state.userOrders[update.id];
            if (update.unbroadcasted) {
              state.unbroadcasted = update.unbroadcasted;
            }
            if (partialmatchorder) {
              const remaining = update.remaining;
              const sideText = partialmatchorder.side === "b" ? "buy" : "sell";
              const baseCurrency = partialmatchorder.market.split("-")[0];
              partialmatchorder.remaining = remaining;
              partialmatchorder.status = "pm";
              const noFeeOrder =
                api.getOrderDetailsWithoutFee(partialmatchorder);
              toast.success(
                `Your ${sideText} order for ${
                  noFeeOrder.baseQuantity.toPrecision(4) / 1
                } ${baseCurrency} @ ${
                  noFeeOrder.price.toPrecision(4) / 1
                } was partial match!`
              );
            }
            break;
          case "m":
            const matchedOrder = state.userOrders[update.id];
            if (!matchedOrder) return;
            matchedOrder.status = "m";
            if (
              matchedOrder &&
              state.userId &&
              matchedOrder.userId === state.userId.toString()
            ) {
              if (!state.userOrders[matchedOrder.id]) {
                state.userOrders[matchedOrder.id] = matchedOrder;
              }
            }
            break;
          case "f":
            delete state.orders[update.id];
            filledOrder = state.userOrders[update.id];
            if (filledOrder) {
              const sideText = filledOrder.side === "b" ? "buy" : "sell";
              const baseCurrency = filledOrder.market.split("-")[0];
              filledOrder.status = "f";
              filledOrder.remaining = 0;
              const noFeeOrder = api.getOrderDetailsWithoutFee(filledOrder);
              toast.success(
                `Your ${sideText} order for ${
                  noFeeOrder.baseQuantity.toPrecision(4) / 1
                } ${baseCurrency} @ ${
                  noFeeOrder.price.toPrecision(4) / 1
                } was filled!`
              );
            }
            break;
          case "pf":
            filledOrder = state.userOrders[update.id];
            state.orders[update.id].remaining = update.remaining;
            state.orders[update.id].status = "pf";
            if (filledOrder) {
              const remaining = update.remaining;
              const sideText = filledOrder.side === "b" ? "buy" : "sell";
              const baseCurrency = filledOrder.market.split("-")[0];
              filledOrder.status = "pf";
              filledOrder.remaining = remaining;
              const noFeeOrder = api.getOrderDetailsWithoutFee(filledOrder);
              toast.success(
                `Your ${sideText} order for ${
                  noFeeOrder.baseQuantity.toPrecision(4) / 1
                } ${baseCurrency} @ ${
                  noFeeOrder.price.toPrecision(4) / 1
                } was partial filled!`
              );
            }
            break;
          case "b":
            filledOrder = state.userOrders[update.id];
            if (filledOrder) {
              filledOrder.status = "b";
              filledOrder.txHash = update.txHash;
            }
            break;
          case "r":
            delete state.orders[update.id];
            filledOrder = state.userOrders[update.id];
            if (filledOrder) {
              const sideText = filledOrder.side === "b" ? "buy" : "sell";
              const error = update.error;
              const baseCurrency = filledOrder.market.split("-")[0];
              filledOrder.status = "r";
              filledOrder.txHash = update.txHash;
              const noFeeOrder = api.getOrderDetailsWithoutFee(filledOrder);
              toast.error(
                `Your ${sideText} order for ${
                  noFeeOrder.baseQuantity.toPrecision(4) / 1
                } ${baseCurrency} @ ${
                  noFeeOrder.price.toPrecision(4) / 1
                } was rejected: ${error}`
              );
              toast.info(
                `This happens occasionally. Run the transaction again and you should be fine.`
              );
            }
            break;
          case "e":
            if (state.userOrders[update.id]) {
              state.userOrders[update.id].status = "e";
            }
            if (state.orders[update.id]) {
              state.orders[update.id].status = "e";
            }
            break;
          default:
            break;
        }
      });
    },
    _orders(state, { payload }) {
      let orders = (payload[0] || [])
        .map(translators.orderBook)
        .reduce((res, order) => { 
          res[order.price] = order;
          return res;
        }, {});

      state.orders = orders;
    },
    _userOrders(state, { payload }) {
      const orders = payload[0]
        .map(translators.userOrder)
        .filter(
          (order) =>
            order.market === state.currentMarket &&
            order.chainId === state.network
        )
        .reduce((res, order) => {
          res[order.id] = order;
          return res;
        }, {});

      if (state.userId) {
        for (let i in orders) {
          if (orders[i].userId === state.userId.toString()) {
            const orderId = orders[i].id;
            state.userOrders[orderId] = orders[i];
            state.unbroadcasted = orders[i].unbroadcasted;
          }
        }
      }
    },
    _swaps(state, { payload }) {
      const orders = payload[0]
        .filter(
          (order) =>
            order.market === state.currentMarket &&
            order.chainId === state.network
        )
        .reduce((res, order) => {
          res[order[1]] = order;
          return res;
        }, {});

      state.orders = {
        ...state.orders,
        ...orders,
      };

      if (state.userId) {
        for (let i in orders) {
          if (orders[i].userId === state.userId.toString()) {
            const orderId = orders[i].id;
            state.userOrders[orderId] = orders[i];
          }
        }
      }
    },
    setBalances(state, { payload }) {
      const scope = makeScope(state);
      state.balances[scope] = state.balances[scope] || {};
      state.balances[scope] = {
        ...state.balances[scope],
        [payload.key]: {
          ...(state.balances[scope][payload.key] || {}),
          ...payload.balances,
        },
      };
    },
    setCurrentMarket(state, { payload }) {
      if (state.currentMarket !== payload) {
        state.currentMarket = payload;
        state.marketFills = {};
        state.marketSummary = {};
        state.liquidity = [];
        state.orders = {};
      }
    },
    setUserId(state, { payload }) {
      state.userId = payload;
    },
    setNetwork(state, { payload }) {
      state.network = payload;
    },
    rangePrice(state, { payload }) {
      state.rangePrice = payload;
    },
    setOrderSide(state, { payload }) {
      state.orderSide = payload;
    },
    setOrderType(state, { payload }) {
      state.orderType = payload;
    },
    setSelectedPrice(state, { payload }) {
      state.selectedPrice = payload;
    },
    clearBridgeReceipts(state, { payload }) {
      const userId = payload;
      const newBridgeReceipts = state.bridgeReceipts.filter((r) => {
        return r.userId !== userId;
      });
      state.bridgeReceipts = newBridgeReceipts;
    },
    addBridgeReceipt(state, { payload }) {
      if (!payload || !payload.txId) return;
      const { amount, token, txUrl, type, userId } = payload;
      if (!state.userId) {
        //‌This is for addresses that have not yet been activated
        state.bridgeReceipts.unshift(payload);
        toast.info("Your wallet address is going to be activate!");
      } else if (state.userId.toString() === userId.toString()) {
        state.bridgeReceipts.unshift(payload);
      } else {
        return {};
      }
      toast.success(
        <>
          Successfully {type === "deposit" ? "deposited" : "withdrew"} {amount}{" "}
          {token}{" "}
          {type === "deposit"
            ? "in your zkSync wallet"
            : "into your Ethereum wallet. Withdraws can take up to 7 hours to complete"}
          .
          <br />
          <br />
          <a
            href={txUrl}
            style={{
              color: "white",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
            target="_blank"
            rel="noreferrer"
          >
            View transaction
          </a>
          {" • "}
          <a
            href="https://zksync.io/faq/faq.html#how-long-are-withdrawal-times"
            style={{
              color: "white",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
            target="_blank"
            rel="noreferrer"
          >
            Bridge FAQ
          </a>
        </>
      );
    },
    updateBridgeReceiptStatus(state, { payload }) {
      const { hash, status } = payload;
      for (let i in state.bridgeReceiptsStatus) {
        if (state.bridgeReceiptsStatus[i].hash === hash) {
          state.bridgeReceiptsStatus[i].status = status;
        }
      }
    },
    resetData(state) {
      state.marketFills = {};
      state.marketSummary = {};
      state.orders = {};
      state.liquidity = [];
    },
    clearUserOrders(state) {
      state.userOrders = {};
      state.userFills = {};
    },
    resetOrderBook(state) {
      state.orders = {};
    },
  },
});

export const {
  setNetwork,
  clearBridgeReceipts,
  setBalances,
  setUserId,
  addBridgeReceipt,
  addbridgeReceiptStatus,
  setCurrentMarket,
  resetData,
  clearUserOrders,
  setOrderType,
  rangePrice,
  setSelectedPrice,
  setOrderSide,
  resetOrderBook,
} = apiSlice.actions;

export const configSelector = (state) => state.api.config;
export const networkSelector = (state) => state.api.network;
export const userOrdersSelector = (state) => state.api.userOrders;
export const userFillsSelector = (state) => state.api.userFills;
export const allOrdersSelector = (state) => state.api.orders;
export const marketFillsSelector = (state) => state.api.marketFills;
export const lastPricesSelector = (state) => state.api.lastPrices;
export const marketSummarySelector = (state) => state.api.marketSummary;
export const marketInfoSelector = (state) => state.api.marketinfo;
export const liquiditySelector = (state) => state.api.liquidity;
export const currentMarketSelector = (state) => state.api.currentMarket;
export const bridgeReceiptsSelector = (state) => state.api.bridgeReceipts;
export const userIdSelector = (state) => state.api.userId;
export const orderTypeSelector = (state) => state.api.orderType;
export const unbroadcastedSelector = (state) => state.api.unbroadcasted;
export const rangePriceSelector = (state) => state.api.rangePrice;
export const orderSideSelector = (state) => state.api.orderSide;
export const selectedPriceSelector = (state) => state.api.selectedPrice;
export const bridgeReceiptsStatusSelector = (state) =>
  state.api.bridgeReceiptsStatus;
export const balancesSelector = (state) =>
  state.api.balances[makeScope(state.api)] || {};

export const handleMessage = createAction("api/handleMessage");

export default apiSlice.reducer;
