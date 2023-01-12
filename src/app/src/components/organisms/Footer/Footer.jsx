import React, { useState } from "react";
import { connect, useSelector } from "react-redux";
import Decimal from "decimal.js";

import "./Footer.css";
import loadingGif from "assets/icons/loading.svg";
import {
  currentMarketSelector,
  unbroadcastedSelector,
  lastPricesSelector,
  networkSelector
} from "lib/store/features/api/apiSlice";
import { Modal } from "../../atoms/Modal";
import Core from "lib/api/Core";
import Tabs from "../Tabs/Tabs";
import { activeFillStatus, activeOrderStatus } from "lib/interface";

const Footer = () => {
  const [selectedTab, setSelectedTab] = useState("orders");
  const [openModal, setOpenModal] = useState(false);



  return (
    <>
      <Modal
        show={openModal}
        actionText="Yes"
        closeText="No"
        alert={"Are you sure you want to delete all orders?"}
        onClose={handleClose}
        onSubmit={() => {
          handleClose();
          Core.run("cancelAllOrders");
        }}></Modal>

    </>
  );
};

export default Footer;
