import { createSlice, createAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import networkManager from "config/NetworkManager";
import { getOrderDetailsWithoutFee } from "lib/utils";
import { fillStatusList, openOrderStatusList } from "lib/interface";

const translators = {
  // used for both initial orders and order updates
  userOrder: o => ({
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
    remaining: +o.unfilled,
    type: o.type,
    createdAt: o.created_at,
    unbroadcasted: o.unbroadcasted,
    makerFee: +o.maker_fee,
    takerFee: +o.taker_fee,
    txHash: o.tx_hash,
  }),

  orderBook: o => ({
    price: +o.price,
    remaining: +o.unfilled,
    side: o.side,
  }),

  // used for both initial fills and fill updates
  fills: f => ({
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
    createdAt: f.created_at,
    makerFee: +f.maker_fee,
    takerFee: +f.taker_fee,
    error: f.error, // tx rejection error message
  }),

  markets_config: c => ({
    market: c.market,
    limitEnabled: c.limit_enabled,
    swapEnabled: c.swap_nabled,
    takerFee: c.taker_fee,
    makerFee: c.maker_fee,
    minMatchAmount: c.min_match_amount,
    minOrderSize: c.min_order_size,
  }),

  markets_stats: s => ({
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
    networks: [],
    network: {
      name: null,
      hasBridge: null,
      securityType: null,
      hasContract: null,
    },
    providerState: "DISCONNECTED",
    currentMarket: null,
    config: {},
    marketFills: {},
    bridgeReceipts: [],
    bridgeReceiptsStatus: [],
    lastPrices: {},
    marketSummary: {},
    marketinfo: {},
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
    user: {
      address: null,
      name: null,
      image: null,
      nonce: null,
      // network main balances
      balances: null,
      availableBalances: null,
      chainDetails: null,
    },
  },
  reducers: {
    _connected_ws(state, { payload }) {
      state.uuid = payload.data.uuid;
    },
    _login_post(state, { payload }) {
      apiSlice.caseReducers._user_orders(state, {
        payload: { data: payload.data.user_orders },
      });
      apiSlice.caseReducers._user_fills(state, {
        payload: { data: payload.data.user_fills },
      });
    },
    _markets_info_get(state, { payload }) {
      state.marketinfo = payload.data.info[0];
    },
    _markets_stats_ws(state, { payload }) {
      if (!payload.data) return;
      state.lastPrices = {};
      payload.data
        .map(translators.markets_stats)
        .filter(update => networkManager.has(state.network.name, update.market))
        .forEach(update => {
          const { market, price, priceChange: change } = update;
          state.lastPrices[market] = {
            price,
            change,
          };
          if (market === state.currentMarket) {
            state.marketSummary = { ...update };
          }
        });
    },
    _markets_config_get(state, { payload }) {
      state.config = payload.data.config.map(translators.markets_config)[0];
    },
    _fills_ws(state, { payload }) {
      payload.data.map(translators.fills).forEach(fill => {
        const fillid = fill.id;
        if (fill.market === state.currentMarket && fill.chainId === state.network.name) {
          state.marketFills[fillid] = fill;
        }
      });
    },
    _user_fills(state, { payload }) {
      payload.data
        .map(translators.fills)
        .filter(fill => fill.chainId === state.network.name)
        .forEach(fill => {
          state.userFills[fill.id] = {
            ...fill,
            isTaker: fill.takerUserAddress === state.user.address,
          };
        });
    },
    _user_fills_new_ws(state, { payload }) {
      apiSlice.caseReducers._user_fills(state, { payload });
    },
    _user_fills_update_ws(state, { payload }) {
      payload.data.map(translators.fills).forEach(update => {
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
      if (!state.user.address) return;
      payload.data
        .map(translators.userOrder)
        .filter(order => order.chainId === state.network.name)
        .forEach(order => {
          if (order.userAddress === state.user.address) {
            state.userOrders[order.id] = order;
            state.unbroadcasted = order.unbroadcasted;
          }
        });
    },
    _user_order_post(state, { payload }) {
      apiSlice.caseReducers._user_orders(state, {
        payload: { data: [payload.data] },
      });
    },
    _user_order_delete(state, { payload }) {
      if (payload.data.success && state.userOrders[payload.data.id]) state.userOrders[payload.data.id].status = "c";
    },
    _user_orders_delete(state, { payload }) {
      for (const id of payload.data.ids)
        if (payload.data.success && state.userOrders[id]) state.userOrders[id].status = "c";
    },
    _user_orders_update_ws(state, { payload }) {
      payload.data.map(translators.userOrder).forEach(async update => {
        let filledOrder, partialmatchorder;
        switch (update.status) {
        case "c":
          if (state.userOrders[update.id]) state.userOrders[update.id].status = "c";
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
            const noFeeOrder = getOrderDetailsWithoutFee(partialmatchorder);
            toast.success(
              `Your ${sideText} order for ${noFeeOrder.baseQuantity.toPrecision(4) / 1} ${baseCurrency} @ ${
                noFeeOrder.price.toPrecision(4) / 1
              } was partial match!`,
            );
          }
          break;
        case "m":
          const matchedOrder = state.userOrders[update.id];
          if (!matchedOrder) return;
          matchedOrder.status = "m";
          matchedOrder.remaining = update.remaining;
          if (matchedOrder && state.user.address && matchedOrder.userAddress === state.user.address) {
            if (!state.userOrders[matchedOrder.id]) state.userOrders[matchedOrder.id] = matchedOrder;
          }
          break;
        case "f":
          filledOrder = state.userOrders[update.id];
          if (filledOrder) {
            const sideText = filledOrder.side === "b" ? "buy" : "sell";
            const baseCurrency = filledOrder.market.split("-")[0];
            filledOrder.status = "f";
            filledOrder.remaining = 0;
            const noFeeOrder = getOrderDetailsWithoutFee(filledOrder);
            toast.success(
              `Your ${sideText} order for ${noFeeOrder.baseQuantity.toPrecision(4) / 1} ${baseCurrency} @ ${
                noFeeOrder.price.toPrecision(4) / 1
              } was filled!`,
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
          //     const noFeeOrder = getOrderDetailsWithoutFee(filledOrder);
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
            const noFeeOrder = getOrderDetailsWithoutFee(filledOrder);
            toast.error(
              `Your ${sideText} order for ${noFeeOrder.baseQuantity.toPrecision(4) / 1} ${baseCurrency} @ ${
                noFeeOrder.price.toPrecision(4) / 1
              } was rejected: ${error}`,
            );
            toast.info("This happens occasionally. Run the transaction again and you should be fine.");
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
    _markets_subscription_post(state, { payload }) {},
    _markets_subscription_delete(state, { payload }) {},
    _orderbook(state, { payload }) {
      state.orders = payload.data.map(translators.orderBook).reduce((res, order) => {
        res[order.price] = order;
        return res;
      }, {});
    },
    _orderbook_ws(state, { payload }) {
      apiSlice.caseReducers._orderbook(state, { payload });
    },
    _orders_get(state, { payload }) {
      apiSlice.caseReducers._orderbook(state, {
        payload: { data: payload.data.orderbook },
      });
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
    setNetwork(state, { payload }) {
      state.network = payload;
      if (!networkManager.has(state.network.name, state.currentMarket))
        apiSlice.caseReducers.setCurrentMarket(state, {
          payload: networkManager.get(state.network.name)[0],
        });
    },
    setProviderState(state, { payload }) {
      state.providerState = payload;
    },
    setNetworkList(state, { payload }) {
      state.networks = payload;
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
      const newBridgeReceipts = state.bridgeReceipts.filter(r => {
        return r.userAddress !== userAddress;
      });
      state.bridgeReceipts = newBridgeReceipts;
    },
    addBridgeReceipt(state, { payload }) {
      if (!payload || !payload.txId) return;
      const { amount, token, txUrl, type, userAddress } = payload;
      if (!state.user.address) {
        //‌This is for addresses that have not yet been activated
        state.bridgeReceipts.unshift(payload);
        toast.info("Your wallet address is going to be activate!");
      }
      if (state.user.address === userAddress) {
        state.bridgeReceipts.unshift(payload);
      } else {
        return {};
      }
      toast.success(
        <>
          Successfully {type === "deposit" ? "deposited" : "withdrew"} {amount} {token}{" "}
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
            rel="noreferrer">
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
            rel="noreferrer">
            Bridge FAQ
          </a>
        </>,
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
    setUserAddress(state, { payload }) {
      state.user.address = payload;
    },
    setUserName(state, { payload }) {
      state.user.name = payload;
    },
    setUserImage(state, { payload }) {
      state.user.image = payload;
    },
    setUserNonce(state, { payload }) {
      state.user.nonce = payload;
    },
    setUserBalances(state, { payload }) {
      state.user.balances = payload;
    },
    setUserAvailableBalances(state, { payload }) {
      state.user.availableBalances = payload;
    },
    setUserChainDetails(state, { payload }) {
      state.user.chainDetails = {
        ...(state.user.chainDetails ?? {}),
        ...payload,
      };
    },
    setUserDetails(state, { payload }) {
      state.user.address = payload.address;
      state.user.name = payload.name;
      state.user.image = payload.image;
      state.user.nonce = payload.nonce;
      state.user.balances = payload.balances;
      state.user.availableBalances = payload.availableBalances;
      state.user.chainDetails = payload.chainDetails;
    },
    clearUserDetails(state) {
      state.user.address = null;
      state.user.name = null;
      state.user.image = null;
      state.user.nonce = null;
      state.user.balances = null;
      state.user.availableBalances = null;
      state.user.chainDetails = null;
    },
  },
});

export const {
  setNetwork,
  setNetworkList,
  setProviderState,
  clearBridgeReceipts,
  setBalances,
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
  setUserAddress,
  setUserName,
  setUserNonce,
  setUserBalances,
  setUserAvailableBalances,
  setUserChainDetails,
  setUserDetails,
  clearUserDetails,
} = apiSlice.actions;

export const configSelector = state => state.api.config;
export const networkSelector = state => state.api.network.name;
export const networkConfigSelector = state => state.api.network;
export const providerStateSelector = state => state.api.providerState;
export const userOrdersSelector = state => state.api.userOrders;
export const userFillsSelector = state => state.api.userFills;
export const allOrdersSelector = state => state.api.orders;
export const marketFillsSelector = state => state.api.marketFills;
export const lastPricesSelector = state => state.api.lastPrices;
export const marketSummarySelector = state => state.api.marketSummary;
export const marketInfoSelector = state => state.api.marketinfo;
export const liquiditySelector = state => state.api.liquidity;
export const currentMarketSelector = state => state.api.currentMarket;
export const bridgeReceiptsSelector = state => state.api.bridgeReceipts;
export const orderTypeSelector = state => state.api.orderType;
export const unbroadcastedSelector = state => state.api.unbroadcasted;
export const rangePriceSelector = state => state.api.rangePrice;
export const orderSideSelector = state => state.api.orderSide;
export const selectedPriceSelector = state => state.api.selectedPrice;
export const uuidSelector = state => state.api.uuid;
export const bridgeReceiptsStatusSelector = state => state.api.bridgeReceiptsStatus;

export const networkListSelector = state => state.api.networks;
export const userOpenOrdersSelector = state =>
  !!state.api.userOrders &&
  Object.values(state.api.userOrders)
    .sort((a, b) => b.id - a.id)
    .filter(order => order.status === "o" && order.market === state.api.currentMarket);
export const userFillOrdersSelector = state =>
  !!state.api.userFills &&
  Object.values(state.api.userFills)
    .sort((a, b) => b.id - a.id)
    .filter(fill => fillStatusList.includes(fill.status));
export const getLastOrdersSelector = state =>
  !!state.api.userOrders &&
  Object.values(state.api.userOrders)
    .slice(-25)
    .sort((a, b) => b.id - a.id)
    .filter(order => order.status !== "o");

export const userBalanceByTokenSelector = state =>
  !!state.api.user.balances &&
  Object.keys(state.api.user.balances).map(val => {
    return {
      [val]: state.api.user.balances[val].valueReadable,
    };
  });
export const userAddressSelector = state => state.api.user.address;
export const userNameSelector = state => state.api.user.name;
export const userImageSelector = state => state.api.user.image;
export const userNonceSelector = state => state.api.user.nonce;
export const userBalancesSelector = state => state.api.user.balances;
export const userAvailableBalancesSelector = state => state.api.user.availableBalances;
export const userChainDetailsSelector = state => state.api.user.chainDetails;
export const userSelector = state => state.api.user;

export const handleMessage = createAction("api/handleMessage");

export default apiSlice.reducer;
