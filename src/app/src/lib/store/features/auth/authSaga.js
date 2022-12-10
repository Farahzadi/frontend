import { REHYDRATE } from "redux-persist";
import { takeEvery, select, apply, all } from "redux-saga/effects";
import api from "lib/api";

const DEFAULT_NETWORK = process.env.REACT_APP_DEFAULT_NETWORK;

function* handleHydration({ payload, key }) {
  if (key === "api") {
    if (payload && payload.network) {
      const user = yield select((state) => state.auth?.user);
      yield api.setNetwork(payload.network.name);

      if (user?.address) {
        try {
          yield apply(api, api.connectWallet, []);
        } catch (err) {
          console.log("There was an error reauthenticating", err);
        }
      }
    } else {
      console.log(`Switching to default network "${DEFAULT_NETWORK}"`);
      api.setNetwork(DEFAULT_NETWORK ?? "ethereum");
    }
  }
}

export function* authHandlerSaga() {
  yield takeEvery(REHYDRATE, handleHydration);
}

export default function* authSaga() {
  yield all([authHandlerSaga()]);
}
