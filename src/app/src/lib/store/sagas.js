import { all } from "redux-saga/effects";
import apiSaga from "lib/store/features/api/apiSaga";

export default function* rootSaga() {
  yield all([apiSaga()]);
}
