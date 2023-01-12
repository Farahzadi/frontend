import React from "react";
import Provider from "lib/Provider";

import AppRoutes from "AppRoutes";
import { ToastContainer } from "react-toastify";
import { Modal } from "components";

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "App.css";

class App extends React.Component {

  render() {
    return (
      <Provider {...this.props.redux}>
        <AppRoutes />
        <Modal.Component />
        <ToastContainer position="bottom-right" theme="colored" />
      </Provider>
    );
  }

}

export default App;
