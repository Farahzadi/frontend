import AppRoutes from "AppRoutes";
import React from "react";

import Provider from "lib/Provider";
import api from "lib/api";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "App.css";
import clearCache from "./cacheHandler";

api.start();

const main = () => {
  return (
    <Provider>
      <AppRoutes />
    </Provider>
  );
};
const ClearCacher = clearCache(main);

const App = () => {
  return <ClearCacher/>;
};

export default App;
