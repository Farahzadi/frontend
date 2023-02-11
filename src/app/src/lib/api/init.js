import {
  handleMessage,
  addBridgeReceipt,
  addbridgeReceiptStatus,
  addEventLogs,
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
  setStage,
  setUserNonce,
} from "lib/store/features/api/apiSlice";

export const updateUserNonce = "updateUserNonce";

export const initActions = (core, store) => {
  core.on("bridgeReceipt", bridgeReceipt => {
    store.dispatch(addBridgeReceipt(bridgeReceipt));
  });

  core.on("bridgeReceiptStatus", status => {
    store.dispatch(addbridgeReceiptStatus(status));
  });

  core.on("eventLogs", eventLog => {
    store.dispatch(addEventLogs(eventLog));
  });

  core.on("signOut", () => {
    store.dispatch(clearUserOrders());
    store.dispatch(clearUserDetails());
  });

  core.on("networkChange", payload => {
    store.dispatch(setNetwork(payload));
  });

  core.on("providerStateChange", state => {
    console.log("PROVIDER STATE CHANGE", state);
    store.dispatch(setProviderState(state));
  });

  core.on("message", (op, data) => {
    store.dispatch(handleMessage({ op, data }));
  });

  core.on("rangePrice", price => {
    store.dispatch(rangePrice(price));
  });

  core.on("selectedPrice", price => {
    store.dispatch(setSelectedPrice(price));
  });

  core.on("orderSide", side => {
    store.dispatch(setOrderSide(side));
  });

  core.on("close", () => {
    store.dispatch(clearUuid());
  });

  core.on("setNetworkList", networks => {
    store.dispatch(setNetworkList(networks));
  });

  core.on("updateUser", user => {
    store.dispatch(setUserDetails(user));
  });
  core.on("updateUserNonce", user => {
    store.dispatch(setUserNonce(user));
  });

  core.on("updateUserAddress", userAddress => {
    store.dispatch(setUserAddress(userAddress));
  });

  core.on("updateUserBalances", balances => {
    store.dispatch(setUserBalances(balances));
  });

  core.on("updateUserAvailableBalances", availableBalances => {
    store.dispatch(setUserAvailableBalances(availableBalances));
  });

  core.on("updateUserChainDetails", chainDetails => {
    store.dispatch(setUserChainDetails(chainDetails));
  });

  core.on("setStage", (type, stage) => {
    store.dispatch(setStage({ type, stage }));
  });
};
