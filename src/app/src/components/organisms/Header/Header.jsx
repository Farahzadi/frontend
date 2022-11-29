import { useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button, Dropdown, AccountDropdown, Menu, MenuItem } from "components";
import { userSelector } from "lib/store/features/auth/authSlice";
import { networkConfigSelector } from "lib/store/features/api/apiSlice";
import api from "lib/api";
import logo from "assets/images/LogoMarkCremeLight.svg";
import menu from "assets/icons/menu.png";
import darkPlugHead from "assets/icons/dark-plug-head.png";
import "./Header.css";
import NetworkSelection from "components/molecules/NetworkSelection/NetworkSelection";

export const Header = (props) => {
  // state to open or close the sidebar in mobile
  const [show, setShow] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const user = useSelector(userSelector);
  const networkConfig = useSelector(networkConfigSelector);
  // const history = useHistory();
  // const location = useLocation();

  const hasBridge = networkConfig.hasBridge;

  const handleMenu = ({ key }) => {
    switch (key) {
      case "signOut":
        api.disconnectWallet();
        return;
      default:
        throw new Error("Invalid dropdown option");
    }
  };

  const dropdownMenu = (
    <Menu onSelect={handleMenu}>
      <MenuItem key="signOut">Disconnect</MenuItem>
    </Menu>
  );

  const connect = () => {
    setConnecting(true);
    api.connectWallet().finally(() => {
      setConnecting(false);
    });
  };

  return (
    <header>
      <div className="mobile_header mb_h">
        <img src={logo} alt="logo" className="logo-container" />
        {/* open sidebar function */}
        <img
          onClick={() => {
            setShow(!show);
          }}
          src={menu}
          alt="..."
        />
      </div>
      {/* mobile sidebar */}
      {show ? (
        <div className="mb_header_container mb_h">
          <img src={logo} alt="logo" />
          <div className="nav_items">
            <ul>
              <li>
                <NavLink exact to="/" activeClassName="active_link">
                  Trade
                </NavLink>
              </li>
              {hasBridge && (
                <li>
                  <NavLink exact to="/bridge" activeClassName="active_link">
                    Bridge
                  </NavLink>
                </li>
              )}
              {process.env.NODE_ENV === "development" && (
                <li>
                  <NavLink exact to="/">
                    Docs
                  </NavLink>
                </li>
              )}
            </ul>
          </div>
          <div className="wallet">
            <div className="d-flex align-items-center justify-content-between mb-3 mb-lg-0">
              {user.id && user.address ? (
                <Dropdown overlay={dropdownMenu}>
                  <button className="address_button">
                    {user.address.slice(0, 6)}...
                    {user.address.slice(-4)}
                  </button>
                </Dropdown>
              ) : (
                <Button
                  loading={connecting}
                  className="bg_btn"
                  onClick={connect}
                >
                  <img src={darkPlugHead} alt="..." /> CONNECT WALLET
                </Button>
              )}
            </div>
            <NetworkSelection />
          </div>
        </div>
      ) : null}

      {/* desktop header */}
      <div className="head_wrapper_desktop dex_h">
        <div className="nav_items">
          <a href="#" rel="noreferrer">
            <img src={logo} alt="logo" />
          </a>
          <ul className="mx-0 px-0">
            <li>
              <NavLink exact to="/" activeClassName="active_link">
                Trade
              </NavLink>
            </li>
            {hasBridge && (
              <li>
                <NavLink exact to="/bridge" activeClassName="active_link">
                  Bridge
                </NavLink>
              </li>
            )}
            {/* {user.id ? */}
            <li>
              <NavLink exact to="/security" activeClassName="active_link">
                Security
              </NavLink>
            </li>
            {/* :null} */}
            <li>
              <NavLink exact to="/">
                Docs
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="wallet">
          <NetworkSelection />

          <div className="head_account_area">
            {user.id || user.address ? (
              <AccountDropdown />
            ) : (
              <Button
                className="bg_btn"
                loading={connecting}
                text="CONNECT WALLET"
                img={darkPlugHead}
                onClick={connect}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
