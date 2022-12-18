import api from "lib/api";
import { takeEvery, put, all, select, delay, apply } from "redux-saga/effects";
import { resetData } from "./apiSlice";

function* handleSingleMessageSaga({ payload }) {
  let { op, data } = payload;
  if (!op) return;
  yield put({
    type: `api/_${op}`,
    payload: data,
  });
}

function* delegateAuthChangeSaga({ type, payload }) {
  if (type.indexOf("auth/") !== 0) {
    yield put(resetData());
  }

  if (type === "auth/signIn" || type === "auth/signOut");
}

export function* messageHandlerSaga() {
  yield all([
    takeEvery("api/handleMessage", handleSingleMessageSaga),
    takeEvery("auth/signOut", delegateAuthChangeSaga),
    takeEvery("auth/signIn", delegateAuthChangeSaga),
  ]);
}

export function* userPollingSaga() {
  while (1) {
    try {
      yield apply(api, api.run, ["updateUserBalancesState", true]);
    } catch (err) {
      console.log("api run", err);
    }
    yield delay(4000);
  }
}

export default function* apiSaga() {
  yield all([userPollingSaga(), messageHandlerSaga()]);
}
