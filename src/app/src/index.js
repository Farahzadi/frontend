import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

import reportWebVitals from "./reportWebVitals";
import * as Sentry from '@sentry/browser';

var DSN_ADDRESS;

if (process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    DSN_ADDRESS = process.env.REACT_APP_DSN_ADDRESS || "https://af881b82bd024fa18cfa0274c610fcec@sentry.ir-cloud.ir/24"   
}else {
    DSN_ADDRESS = null
}

Sentry.init({
    dsn: DSN_ADDRESS
});

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById("root")
);

reportWebVitals();
