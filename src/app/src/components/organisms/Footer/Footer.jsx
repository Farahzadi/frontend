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

  const tabs = [
    { name: "open orders", id: "orders" },
    { name: "trade history", id: "fills" },
    { name: "order history", id: "history" },
    { name: "assets", id: "balances" }
  ];
  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  const renderTableBody = () => {
    switch (selectedTab) {
      case "orders":
        return <OpenOrders />;
      case "fills":
        return <FillOrders />;
      case "history":
        return <HistoryOrders />;
      case "balances":
        return <Balances />;
    }
  };

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
      <div className="user-info">
        <div className="user-info-container ">
          {/* <div> */}
            <Tabs
              items={tabs}
              handleSelect={(val) => setSelectedTab(val)}
              active={selectedTab}></Tabs>
            <div className="ft_tabs">
            {/* need to fix */}
              {/* {getOpenOrders().length > 1 &&  */}
                <button className="cancel-all-order" onClick={handleOpen}>
                  cancel all order
                </button>
              {/* } */}
            </div>
          </div>
          <div className="user-info-orders">{renderTableBody()}</div>
        </div>
      {/* </div> */}
    </>
  );
};

export default Footer;
