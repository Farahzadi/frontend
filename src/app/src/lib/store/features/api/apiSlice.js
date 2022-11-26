import { createSlice, createAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import api from "lib/api";

const makeScope = (state) => `${state.network}-${state.userAddress}`;

const translators = {
  // used for both initial orders and order updates
  userOrder: (o) => ({
    chainId: o.network,
    id: o.id,
    market: o.market,
    side: o.side,
    price: +o.price,
    baseQuantity: +o.base_quantity,
    quoteQuantity: +o.quote_quantity,
    expires: o.expiration,
    userAddress: o.user_address,
    status: o.status,
    remaining: o.unfilled,
    type: o.type,
    insertTimestamp: o.created_at,
    unbroadcasted: o.unbroadcasted,
    makerFee: +o.maker_fee,
    takerFee: +o.taker_fee,
    txHash: o.tx_hash,
  }),

  orderBook: (o) => ({
    price: +o.price,
    remaining: +o.unfilled,
    side: o.side,
  }),

  // used for both initial fills and fill updates
  fills: (f) => ({
    chainId: f.network,
    id: f.id,
    market: f.market,
    takerSide: f.taker_side,
    price: +f.price,
    amount: +f.amount,
    status: f.status,
    txHash: f.tx_hash,
    takerUserAddress: f.taker_user_address,
    makerUserAddress: f.maker_user_address,
    type: f.type,
    takerOrderAddress: f.taker_order_address,
    makerOrderAddress: f.maker_order_address,
    insertTimestamp: f.created_at,
    makerFee: +f.maker_fee,
    takerFee: +f.taker_fee,
    error: f.error, // tx rejection error message
  }),

  markets_config: (c) => ({
    market: c.market,
    limitEnabled: c.limit_enabled,
    swapEnabled: c.swap_nabled,
    takerFee: c.taker_fee,
    makerFee: c.maker_fee,
    swapFee: c.swapFee,
    minMatchAmount: c.min_match_amount,
  }),

  markets_stats: (s) => ({
    market: s.market,
    price: s.last_price,
    priceChange: s.change,
    "24hi": s.high_price,
    "24lo": s.low_price,
    baseVolume: s.base_volume,
    quoteVolume: s.quote_volume,
  }),
};

export const apiSlice = createSlice({
  name: "api",
  initialState: {
    network: "zksyncv1_goerli",
    userAddress: null,
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
    uuid: null,
  },
  reducers: {
    _connected_ws(state, { payload }) {
      console.log("UUID", payload.uuid);
      api.ws.uuid = payload.uuid;
      state.uuid = payload.uuid;
    },
    _login_post(state, { payload }) {
      console.log("LOGIN CAME", payload);
      sessionStorage.setItem("access_token", payload.access_token);
      // payload.user_id
      apiSlice.caseReducers._user_orders(state, {
        payload: payload.user_orders,
      });
      apiSlice.caseReducers._user_fills(state, { payload: payload.user_fills });
    },
    _markets_info_get(state, { payload }) {
      console.log("info came", payload);
      state.marketinfo = payload.info[0];
    },
    _markets_stats_ws(state, { payload }) {
      // console.log("markets stats", payload);
      payload.map(translators.markets_stats).forEach((update) => {
        const { market, price, priceChange: change } = update;
        if (api.validMarkets[state.network].includes(market)) {
          state.lastPrices[market] = {
            price,
            change,
          };
        } else {
          delete state.lastPrices[market];
        }
        if (market === state.currentMarket) {
          state.marketSummary = { ...update };
        }
      });
    },
    _markets_config_get(state, { payload }) {
      console.log("config came", payload);
      state.config = payload.config.map(translators.markets_config)[0];
    },
    // _swapfills(state, { payload }) {
    //   return;
    //   payload[0].forEach((fill) => {
    //     const fillid = fill.id;
    //     if (
    //       fill.market === state.currentMarket &&
    //       fill.chainId === state.network
    //     ) {
    //       state.marketFills[fillid] = fill;
    //     }
    //     state.userFills[fillid] = fill;
    //   });
    // },
    _fills_ws(state, { payload }) {
      // console.log("fills", payload);
      payload.map(translators.fills).forEach((fill) => {
        const fillid = fill.id;
        if (
          fill.market === state.currentMarket &&
          fill.chainId === state.network
        ) {
          state.marketFills[fillid] = fill;
        }
      });
    },
    _user_fills(state, { payload }) {
      console.log("user fills", payload);
      payload
        .map(translators.fills)
        .filter((fill) => fill.chainId === state.network)
        .forEach((fill) => {
          state.userFills[fill.id] = {
            ...fill,
            isTaker: fill.takerUserAddress === state.userAddress.toString(),
          };
        });
    },
    _user_fills_new_ws(state, { payload }) {
      apiSlice.caseReducers._user_fills(state, { payload });
    },
    _user_fills_update_ws(state, { payload }) {
      console.log("user fills update", payload);
      payload.map(translators.fills).forEach((update) => {
        let transactionHash;
        const fillId = update.id;
        const newStatus = update.status;

        if (update.txHash) transactionHash = update.txHash;
        if (state.userFills[fillId]) {
          state.userFills[fillId].status = newStatus;
          if (transactionHash) state.userFills[fillId].txHash = transactionHash;
        }
      });
    },
    _user_orders(state, { payload }) {
      console.log("user orders...", payload);
      if (!state.userAddress) return;
      payload
        .map(translators.userOrder)
        .filter((order) => order.chainId === state.network)
        .forEach((order) => {
          if (order.userAddress === state.userAddress.toString()) {
            state.userOrders[order.id] = order;
            state.unbroadcasted = order.unbroadcasted;
          }
        });
    },
    _user_order_post(state, { payload }) {
      toast.info("order post came");
      apiSlice.caseReducers._user_orders(state, { payload: [payload] });
    },
    _user_order_delete(state, { payload }) {
      console.log("user order delete came", payload);
      if (payload.success && state.userOrders[payload.id])
        state.userOrders[payload.id].status = "c";
    },
    _user_orders_delete(state, { payload }) {
      console.log("user orders delete came", payload);
      for (const id of payload.ids)
        if (payload.success && state.userOrders[id])
          state.userOrders[id].status = "c";
    },
    _user_orders_update_ws(state, { payload }) {
      payload.map(translators.userOrder).forEach(async (update) => {
        let filledOrder, partialmatchorder;
        switch (update.status) {
          case "c":
            if (state.userOrders[update.id])
              state.userOrders[update.id].status = "c";
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
              state.userAddress &&
              matchedOrder.userAddress === state.userAddress.toString()
            ) {
              if (!state.userOrders[matchedOrder.id])
                state.userOrders[matchedOrder.id] = matchedOrder;
            }
            break;
          case "f":
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
          // case "pf":
          //   filledOrder = state.userOrders[update.id];
          //   state.orders[update.id].remaining = update.remaining;
          //   state.orders[update.id].status = "pf";
          //   if (filledOrder) {
          //     const remaining = update.remaining;
          //     const sideText = filledOrder.side === "b" ? "buy" : "sell";
          //     const baseCurrency = filledOrder.market.split("-")[0];
          //     filledOrder.status = "pf";
          //     filledOrder.remaining = remaining;
          //     const noFeeOrder = api.getOrderDetailsWithoutFee(filledOrder);
          //     toast.success(
          //       `Your ${sideText} order for ${noFeeOrder.baseQuantity.toPrecision(4) / 1
          //       } ${baseCurrency} @ ${noFeeOrder.price.toPrecision(4) / 1
          //       } was partial filled!`
          //     );
          //   }
          //   break;
          case "b":
            filledOrder = state.userOrders[update.id];
            if (filledOrder) {
              filledOrder.status = "b";
              filledOrder.txHash = update.txHash;
            }
            break;
          case "r":
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
            break;
          default:
            break;
        }
      });
    },
    _markets_subscription_post(state, { payload }) {
      // console.log("SUB POST", payload);
    },
    _markets_subscription_delete(state, { payload }) {
      // console.log("SUB DELETE", payload);
    },
    _orderbook(state, { payload }) {
      state.orders = payload.map(translators.orderBook).reduce((res, order) => {
        res[order.price] = order;
        return res;
      }, {});
    },
    _orderbook_ws(state, { payload }) {
      // console.log("orderbook", payload);
      apiSlice.caseReducers._orderbook(state, { payload });
    },
    _orders_get(state, { payload }) {
      // console.log("orders came", payload);
      apiSlice.caseReducers._orderbook(state, { payload: payload.orderbook });
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
    setUserAddress(state, { payload }) {
      state.userAddress = payload;
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
      const userAddress = payload;
      const newBridgeReceipts = state.bridgeReceipts.filter((r) => {
        return r.userAddress !== userAddress;
      });
      state.bridgeReceipts = newBridgeReceipts;
    },
    addBridgeReceipt(state, { payload }) {
      if (!payload || !payload.txId) return;
      const { amount, token, txUrl, type, userAddress } = payload;
      if (!state.userAddress) {
        //‌This is for addresses that have not yet been activated
        state.bridgeReceipts.unshift(payload);
        toast.info("Your wallet address is going to be activate!");
      }
      if (state.userAddress === userAddress) {
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
    clearUuid(state) {
      state.uuid = null;
    },
  },
});

export const {
  setNetwork,
  clearBridgeReceipts,
  setBalances,
  setUserAddress,
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
  clearUuid,
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
export const userAddressSelector = (state) => state.api.userAddress;
export const orderTypeSelector = (state) => state.api.orderType;
export const unbroadcastedSelector = (state) => state.api.unbroadcasted;
export const rangePriceSelector = (state) => state.api.rangePrice;
export const orderSideSelector = (state) => state.api.orderSide;
export const selectedPriceSelector = (state) => state.api.selectedPrice;
export const uuidSelector = (state) => state.api.uuid;
export const bridgeReceiptsStatusSelector = (state) =>
  state.api.bridgeReceiptsStatus;
export const balancesSelector = (state) =>
  state.api.balances[makeScope(state.api)] || {};

export const handleMessage = createAction("api/handleMessage");

export default apiSlice.reducer;
