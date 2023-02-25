import { createSlice, createAction } from "@reduxjs/toolkit";
import networkManager from "config/NetworkManager";
import { getOrderDetailsWithoutFee } from "lib/utils";
import { fillStatusList, openOrderStatusList } from "lib/interface";
import { translators } from "lib/api/api/Translators";

export const apiSlice = createSlice({
  name: "api",
  initialState: {
    networks: [],
    network: {
      name: null,
      isL2: null,
      hasBridge: null,
      hasWrapper: null,
      securityType: null,
    },
    providerState: "DISCONNECTED",
    currentMarket: null,
    config: {},
    marketFills: {},
    bridgeReceipts: [],
    bridgeReceiptsStatus: [],
    eventLogs: [],
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
    stages: {
      connection: null,
      zksyncActivation: null,
    },
    notifications: [], // { id, type, message }
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
            partialmatchorder.remaining = remaining;
            partialmatchorder.status = "pm";
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
            filledOrder.status = "f";
            filledOrder.remaining = 0;
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
          //     core.run("notify", "success",
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
            filledOrder.status = "r";
            filledOrder.txHash = update.txHash;
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
      const { userAddress } = payload;
      if (state.user.address !== userAddress) return;
      state.bridgeReceipts.unshift(payload);
    },
    updateBridgeReceiptStatus(state, { payload }) {
      const { hash, status } = payload;
      for (let i in state.bridgeReceiptsStatus) {
        if (state.bridgeReceiptsStatus[i].hash === hash) {
          state.bridgeReceiptsStatus[i].status = status;
        }
      }
    },
    addEventLogs(state, { payload }) {
      payload.forEach(event => {
        state.eventLogs.unshift({
          eventName: event.event,
          from: event.args.dst || event.args.src,
          to: event.address,
          amount: event.args.wad.toString(),
          txHash: event.transactionHash,
        });
      });
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
    setStage(state, { payload }) {
      state.stages[payload.type] = payload.stage;
    },
    setAllowance(state, { payload }) {
      const { allowance, currency } = payload;
      if (state.user.chainDetails.allowances) {
        state.user.chainDetails.allowances[currency] = allowance;
      }
    },
    setL1Allowance(state, { payload }) {
      const { allowance, currency } = payload;
      if (state.user.chainDetails.L1Allowances) {
        state.user.chainDetails.L1Allowances[currency] = allowance;
      }
    },
    addNotification(state, { payload }) {
      state.notifications.unshift(payload);
    },
    removeNotification(state, { payload }) {
      state.notifications = state.notifications.filter(notif => notif.id !== payload);
    },
    updateNotification(state, { payload }) {
      const notif = state.notifications.find(notif => notif.id === payload.id);
      if (!notif) return;
      Object.entries(payload.props).forEach(([prop, value]) => (notif[prop] = value));
    },
    clearNotifications(state) {
      state.notifications = [];
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
  addEventLogs,
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
  setStage,
  setAllowance,
  setL1Allowance,
  addNotification,
  removeNotification,
  updateNotification,
  clearNotifications,
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
export const marketListSelector = state => Object.keys(state.api.lastPrices || {});
export const marketSummarySelector = state => state.api.marketSummary;
export const marketInfoSelector = state => state.api.marketinfo;
export const liquiditySelector = state => state.api.liquidity;
export const currentMarketSelector = state => state.api.currentMarket;
export const currencySelector = state => state.api.currentMarket?.split("-") ?? ["", ""];
export const bridgeReceiptsSelector = state => state.api.bridgeReceipts;
export const eventLogsSelector = state => state.api.eventLogs;
export const orderTypeSelector = state => state.api.orderType;
export const unbroadcastedSelector = state => state.api.unbroadcasted;
export const rangePriceSelector = state => state.api.rangePrice;
export const orderSideSelector = state => state.api.orderSide;
export const selectedPriceSelector = state => state.api.selectedPrice;
export const uuidSelector = state => state.api.uuid;
export const bridgeReceiptsStatusSelector = state => state.api.bridgeReceiptsStatus;

export const networkListSelector = state => state.api.networks;
export const userOpenOrdersSelector = state =>
  state.api.userOrders &&
  Object.values(state.api.userOrders)
    .sort((a, b) => b.id - a.id)
    .filter(order => (order.status === "o" ?? order.status === "pm") && order.market === state.api.currentMarket);
export const userFillOrdersSelector = state =>
  state.api.userFills &&
  Object.values(state.api.userFills)
    .sort((a, b) => b.id - a.id)
    .filter(fill => fillStatusList.includes(fill.status));
export const getLastOrdersSelector = state =>
  state.api.userOrders &&
  Object.values(state.api.userOrders)
    .filter(order => order.status !== "o" && order.status !== "pm")
    .slice(-25)
    .sort((a, b) => b.id - a.id);

export const userBalanceByTokenSelector = state =>
  state.api.user.balances &&
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

export const connectionStageSelector = state => state.api.stages.connection;
export const zksyncActivationStageSelector = state => state.api.stages.zksyncActivation;

export const notificationsSelector = state => state.api.notifications;

export const handleMessage = createAction("api/handleMessage");

export default apiSlice.reducer;
