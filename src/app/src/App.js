import React from "react";
import Provider from "lib/Provider";

import AppRoutes from "AppRoutes";
import { ToastContainer } from "react-toastify";
import Modal from "components/atoms/Modal";

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "App.css";
import ZksyncGuide from "components/organisms/Guideline/ZksyncGuide";

class App extends React.Component {

  render() {
    return (
      <Provider {...this.props.redux}>
        <AppRoutes />
        <Modal.Component />
        <ToastContainer position="bottom-right" theme="colored" />
        <ZksyncGuide />
      </Provider>
    );
  }

}

export default App;
