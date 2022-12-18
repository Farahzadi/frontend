import { useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Button, Dropdown, AccountDropdown, Menu, MenuItem } from "components";
import {
  networkConfigSelector,
  userChainDetailsSelector,
  userAddressSelector
} from "lib/store/features/api/apiSlice";
import api from "lib/api";
import logo from "assets/images/logo.svg";
import menu from "assets/icons/menu.png";
import darkPlugHead from "assets/icons/dark-plug-head.png";
import NetworkSelection from "components/molecules/NetworkSelection/NetworkSelection";
import { getDocsLink } from "lib/helpers/env";
import { styled, useMediaQuery } from "@mui/material";
import HamburgerIcon from "components/atoms/Icons/HamburgerIcon";
import { BrandLogo, Logo } from "components/atoms/Icons/Logo";
import { useTheme } from "@mui/styles";
import {
  DexHeader,
  MainContent,
  NavItem,
  NavUl,
  ActionBtnContainer,
  XSLogoContainer
} from "./Header.module";

export const Header = () => {
  // state to open or close the sidebar in mobile
  const [show, setShow] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const userChainDetails = useSelector(userChainDetailsSelector);
  const userAddress = useSelector(userAddressSelector);
  const networkConfig = useSelector(networkConfigSelector);
  const hasBridge = networkConfig.hasBridge;
  const links = [
    { name: "Trade", to: "/" },
    { name: "Bridge", to: "/bridge", isHidden: !hasBridge },
    { name: "Security", to: "/security" },
    { name: "Docs", to: getDocsLink(), target: "blank" }
  ];
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("md"));
  const handleMenu = ({ key }) => {
    switch (key) {
      case "signOut":
        api.disconnectWallet();
        return;
      default:
        throw new Error("Invalid dropdown option");
    }
  };

  const connect = () => {
    setConnecting(true);
    api.connectWallet().finally(() => {
      setConnecting(false);
    });
  };
  const handleOpenNavbar = () => {
    const body = document.getElementsByTagName("body")[0];
    if (!show) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "auto";
    }
    setShow(!show);
  };

  return (
    <DexHeader>
      <BrandLogo />
      {matches && <HamburgerIcon isClicked={show} handleClick={handleOpenNavbar} />}
      <MainContent show={show}>
        {matches && (
          <XSLogoContainer>
            <Logo height={150} width={80} />
          </XSLogoContainer>
        )}
        <NavUl>
          {links.map(
            ({ name, to, isHidden, target }) =>
              !isHidden && (
                <NavItem>
                  {target === "blank" ? (
                    <a href={to} target="_blank" rel="noreferrer noopener">
                      {name}
                    </a>
                  ) : (
                    <NavLink exact to={to} activeClassName="active_link">
                      {name}
                    </NavLink>
                  )}
                </NavItem>
              )
          )}
        </NavUl>
        <ActionBtnContainer>
          <NetworkSelection />
          {userChainDetails?.userId && userAddress ? (
            <AccountDropdown />
          ) : (
            <Button
              className="bg_btn"
              loading={connecting}
              text="CONNECT WALLET"
              img={darkPlugHead}
              onClick={connect}
              style={{ width: "auto" }}
            />
          )}
        </ActionBtnContainer>
      </MainContent>
    </DexHeader>
  );
};
