import {
  handleMessage,
  addBridgeReceipt,
  addbridgeReceiptStatus,
  setNetwork,
  clearUserOrders,
  rangePrice,
  setOrderSide,
  setSelectedPrice,
  clearUuid,
  setNetworkList,
  setProviderState,
  setUserAddress,
  setUserDetails,
  setUserBalances,
  setUserAvailableBalances,
  clearUserDetails,
  setUserChainDetails,
} from "lib/store/features/api/apiSlice";

export const initActions = (api, store) => {
  api.on("bridgeReceipt", (bridgeReceipt) => {
    store.dispatch(addBridgeReceipt(bridgeReceipt));
  });

  api.on("bridgeReceiptStatus", (status) => {
    store.dispatch(addbridgeReceiptStatus(status));
  });

  api.on("signOut", () => {
    store.dispatch(clearUserOrders());
    store.dispatch(clearUserDetails());
  });

  api.on("networkChange", (payload) => {
    store.dispatch(setNetwork(payload));
  });

  api.on("providerStateChange", (state) => {
    console.log("PROVIDER STATE CHANGE", state);
    store.dispatch(setProviderState(state));
  });

  api.on("message", (op, data) => {
    store.dispatch(handleMessage({ op, data }));
  });

  api.on("rangePrice", (price) => {
    store.dispatch(rangePrice(price));
  });

  api.on("selectedPrice", (price) => {
    store.dispatch(setSelectedPrice(price));
  });

  api.on("orderSide", (side) => {
    store.dispatch(setOrderSide(side));
  });

  api.on("close", () => {
    store.dispatch(clearUuid());
  });

  api.on("setNetworkList", (networks) => {
    store.dispatch(setNetworkList(networks));
  });

  api.on("updateUser", (user) => {
    store.dispatch(setUserDetails(user));
  });

  api.on("updateUserAddress", (userAddress) => {
    store.dispatch(setUserAddress(userAddress));
  });

  api.on("updateUserBalances", (balances) => {
    store.dispatch(setUserBalances(balances));
  });

  api.on("updateUserAvailableBalances", (availableBalances) => {
    store.dispatch(setUserAvailableBalances(availableBalances));
  });

  api.on("updateUserChainDetails", (chainDetails) => {
    store.dispatch(setUserChainDetails(chainDetails));
  });
};
