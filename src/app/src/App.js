import AppRoutes from "AppRoutes";
import React from "react";

import Provider from "lib/Provider";
import api from "lib/api";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "App.css";

api.start();

const App = () => {
  return (
    <Provider>
      <AppRoutes />
    </Provider>
  );
};

export default App;
