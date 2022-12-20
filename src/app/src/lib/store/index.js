import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import apiReducer from "lib/store/features/api/apiSlice";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import sagas from "./sagas";

const persistConfig = {
  key: "root",
  whitelist: [],
  stateReconciler: autoMergeLevel2,
  storage,
};

const apiPersistConfig = {
  key: "api",
  whitelist: ["user", "currentMarket", "bridgeReceipts", "network"],
  storage,
};

const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
  api: persistReducer(apiPersistConfig, apiReducer),
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: [sagaMiddleware],
});

sagaMiddleware.run(sagas);

export const persistor = persistStore(store);

export default store;
