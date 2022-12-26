import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

import reportWebVitals from "./reportWebVitals";
import * as Sentry from "@sentry/browser";
import { getAppConfig } from "lib/api";
import { initActions } from "lib/api/init";
import Core from "lib/api/Core";
import Store from "lib/store";
import { checkLocalStorageVersion } from "lib/helpers/utils";

var DSN_ADDRESS;

// if (process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
//     DSN_ADDRESS = process.env.REACT_APP_DSN_ADDRESS
// }else {
//     DSN_ADDRESS = null
// }

// Sentry.init({
//     dsn: DSN_ADDRESS
// });

const startApp = () => {
  checkLocalStorageVersion();

  const config = getAppConfig();

  Core.init(config);

  const core = Core.getInstance();

  Store.init({ core });

  const store = Store.getInstance();
  const { reduxStore, persistor } = store;

  core.setStore(store);

  store.start();

  initActions(core, reduxStore);

  Core.run("start");

  return { redux: { store: reduxStore, persistor } };
};

const startRedering = (config) => {
  ReactDOM.render(
    <React.StrictMode>
      <App redux={config.redux} />
    </React.StrictMode>,
    document.getElementById("root")
  );
};

const startWebVitals = () => {
  reportWebVitals();
};

const init = () => {
  const config = startApp();
  startRedering(config);
  startWebVitals();
};

init();
