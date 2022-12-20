import api from "lib/api";
import { REHYDRATE } from "redux-persist";
import { takeEvery, put, all, select, delay, apply } from "redux-saga/effects";

const DEFAULT_NETWORK = process.env.REACT_APP_DEFAULT_NETWORK;

function* handleSingleMessageSaga({ payload }) {
  let { op, data } = payload;
  if (!op) return;
  yield put({
    type: `api/_${op}`,
    payload: data,
  });
}

export function* messageHandlerSaga() {
  yield takeEvery("api/handleMessage", handleSingleMessageSaga);
}

export function* userPollingSaga() {
  const STEPS_TO_UPDATE_USER_CHAIN_DETAILS = 3;
  for (let i = 0; ; i = (i + 1) % STEPS_TO_UPDATE_USER_CHAIN_DETAILS) {
    const shouldUpdateUserChainDetails =
      i % STEPS_TO_UPDATE_USER_CHAIN_DETAILS === 0;
    try {
      if (api) {
        yield all([
          apply(api, api.run, ["updateUserBalancesState", true]),
          ...(shouldUpdateUserChainDetails
            ? [apply(api, api.run, ["updateUserChainDetailsState", true])]
            : []),
        ]);
      }
    } catch (err) {
      console.log("Error: Core balances and chain details update error:", err);
    }
    yield delay(4000);
  }
}

function* handleHydration({ payload, key }) {
  if (key === "api") {
    if (payload && payload.network) {
      const user = yield select((state) => state.api?.user);
      yield apply(api, api.setNetwork, [payload.network.name]);

      if (user?.address) {
        try {
          yield apply(api, api.run, ["connectWallet"]);
        } catch (err) {
          console.log("There was an error reauthenticating", err);
        }
      }
    } else {
      console.log(`Switching to default network "${DEFAULT_NETWORK}"`);
      yield apply(api, api.setNetwork, [DEFAULT_NETWORK ?? "ethereum"]);
    }
  }
}

export function* hydrationHandlerSaga() {
  yield takeEvery(REHYDRATE, function* (data) {
    yield handleHydration(data);
    if (data?.key === "root") yield userPollingSaga();
  });
}

export default function* apiSaga() {
  yield all([messageHandlerSaga(), hydrationHandlerSaga()]);
}
