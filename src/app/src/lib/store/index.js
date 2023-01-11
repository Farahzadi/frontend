import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import apiReducer from "lib/store/features/api/apiSlice";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import sagas from "./sagas";

class Store {

  static instance = null;

  static getInstance() {
    return this.instance;
  }

  static init(config) {
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

    const persistor = persistStore(store);

    this.instance = new Store(config.core, store, persistor, sagaMiddleware);
  }

  constructor(core, store, persistor, sagaMiddleware) {
    this.core = core;
    this.reduxStore = store;
    this.persistor = persistor;
    this.sagaMiddleware = sagaMiddleware;
  }

  start() {
    this.sagaMiddleware.run(sagas, this.core);
  }

  getState() {
    return this.reduxStore.getState();
  }

}

export default Store;
