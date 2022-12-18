import {
  handleMessage,
  setBalances,
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
} from "lib/store/features/api/apiSlice";
import {
  signIn,
  signOut,
  updateAccountState,
} from "lib/store/features/auth/authSlice";

export const initActions = (api, store) => {
  api.on("accountState", (accountState) => {
    store.dispatch(updateAccountState(accountState));
  });

  api.on("bridgeReceipt", (bridgeReceipt) => {
    store.dispatch(addBridgeReceipt(bridgeReceipt));
  });

  api.on("bridgeReceiptStatus", (status) => {
    store.dispatch(addbridgeReceiptStatus(status));
  });

  api.on("balanceUpdate", (network, balances) => {
    store.dispatch(
      setBalances({
        key: network,
        balances,
      })
    );
  });

  api.on("signIn", (accountState) => {
    store.dispatch(signIn(accountState));
  });

  api.on("userChanged", (userAddress) => {
    store.dispatch(setUserAddress(userAddress));
  });

  api.on("signOut", () => {
    store.dispatch(clearUserOrders());
    store.dispatch(signOut());
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
};
