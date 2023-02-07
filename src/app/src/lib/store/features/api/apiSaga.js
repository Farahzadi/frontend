import { REHYDRATE } from "redux-persist";
import { takeEvery, put, all, select, delay, apply } from "redux-saga/effects";

const DEFAULT_NETWORK = process.env.REACT_APP_DEFAULT_NETWORK;

function* handleSingleMessage({ payload }, core) {
  let { op, data } = payload;
  if (!op) return;
  yield put({
    type: `api/_${op}`,
    payload: data,
    core,
  });
}

export function* messageHandlerSaga(core) {
  yield takeEvery("api/handleMessage", function* (data) {
    yield handleSingleMessage(data, core);
  });
}

export function* userPollingSaga(core) {
  const STEPS_TO_UPDATE_USER_CHAIN_DETAILS = 3;
  for (let i = 0; ; i = (i + 1) % STEPS_TO_UPDATE_USER_CHAIN_DETAILS) {
    const shouldUpdateUserChainDetails = i % STEPS_TO_UPDATE_USER_CHAIN_DETAILS === 0;
    const connectionStage = yield select(state => state.api?.stages?.connection);
    if (connectionStage === "CONNECTED") {
      try {
        yield all([
          apply(core, core.run, ["updateUserBalancesState", true]),
          ...(shouldUpdateUserChainDetails ? [apply(core, core.run, ["updateUserChainDetailsState", true])] : []),
        ]);
      } catch (err) {
        console.log("Error: Core balances and chain details update error:", err);
      }
    }
    yield delay(4000);
  }
}

function* handleHydration({ payload, key }, core) {
  if (key === "api") {
    if (payload && payload.network) {
      const user = yield select(state => state.api?.user);
      yield apply(core, core.run, ["setNetwork", payload.network.name]);

      if (user?.address) {
        try {
          yield apply(core, core.run, ["connectWallet"]);
        } catch (err) {
          console.log("There was an error reauthenticating", err);
        }
      }
    } else {
      console.log(`Switching to default network "${DEFAULT_NETWORK}"`);
      yield apply(core, core.run, ["setNetwork", DEFAULT_NETWORK ?? "ethereum"]);
    }
  }
}

export function* hydrationHandlerSaga(core) {
  yield takeEvery(REHYDRATE, function* (data) {
    yield handleHydration(data, core);
  });
}

export default function* apiSaga(core) {
  yield all([userPollingSaga(core), messageHandlerSaga(core), hydrationHandlerSaga(core)]);
}
