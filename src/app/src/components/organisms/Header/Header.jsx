import { useSelector } from "react-redux";
import { useHistory, useLocation, NavLink } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Button, Dropdown, AccountDropdown, Menu, MenuItem } from "components";
import { networkConfigSelector, userChainDetailsSelector, userAddressSelector } from "lib/store/features/api/apiSlice";
import logo from "assets/images/LogoMarkCremeLight.svg";
import menu from "assets/icons/menu.png";
import darkPlugHead from "assets/icons/dark-plug-head.png";
import NetworkSelection from "components/molecules/NetworkSelection/NetworkSelection";
import { getDocsLink } from "lib/helpers/env";
import { styled, useMediaQuery } from "@mui/material";
import HamburgerIcon from "components/atoms/Icons/HamburgerIcon";
import { BrandLogo, Logo } from "components/atoms/Icons/Logo";
import { NotificationDrawer } from "./NotificationDrawer";
import { useTheme } from "@mui/styles";
import {
  DexHeader,
  MainContent,
  NavItem,
  NavUl,
  ActionBtnContainer,
  XSLogoContainer,
  ResponsiveItems,
} from "./Header.module";
import Core from "lib/api/Core";

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
    { name: "Docs", to: getDocsLink(), target: "blank" },
  ];
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("md"));
  const handleMenu = ({ key }) => {
    switch (key) {
    case "signOut":
      Core.run("disconnectWallet");
      return;
    default:
      throw new Error("Invalid dropdown option");
    }
  };

  const connect = () => {
    setConnecting(true);
    Core.run("connectWallet").finally(() => {
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
      {matches && (
        <ResponsiveItems>
          {process.env.NODE_ENV === "development" && <NotificationDrawer />}
          <HamburgerIcon isClicked={show} handleClick={handleOpenNavbar} />
        </ResponsiveItems>
      )}
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
          {userAddress ? (
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
          {process.env.NODE_ENV === "development" && !matches && <NotificationDrawer />}
        </ActionBtnContainer>
      </MainContent>
    </DexHeader>
  );
};
