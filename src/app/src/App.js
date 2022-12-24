import AppRoutes from "AppRoutes";
import React from "react";

import Provider from "lib/Provider";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "App.css";

class App extends React.Component {
  render() {
    return (
      <Provider {...this.props.redux}>
        <AppRoutes />
      </Provider>
    );
  }
}

export default App;
