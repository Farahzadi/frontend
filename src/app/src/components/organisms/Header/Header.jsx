import { useSelector } from "react-redux";
import { useHistory, useLocation, NavLink } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Button, Dropdown, AccountDropdown, Menu, MenuItem } from "components";
import { networkConfigSelector, userChainDetailsSelector, userAddressSelector } from "lib/store/features/api/apiSlice";
import logo from "assets/images/LogoMarkCremeLight.svg";
import menu from "assets/icons/menu.png";
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
import ConnectButton from "components/molecules/ConnectButton/ConnectButton";

export const Header = () => {
  // state to open or close the sidebar in mobile
  const [show, setShow] = useState(false);
  const networkConfig = useSelector(networkConfigSelector);
  const { hasBridge, hasWrapper } = networkConfig;
  const links = [
    { name: "Trade", to: "/" },
    { name: "Bridge", to: "/bridge", isHidden: !hasBridge },
    { name: "wrapper", to: "/wrapper", isHidden: !hasWrapper },
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
          <NotificationDrawer />
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
              ),
          )}
        </NavUl>
        <ActionBtnContainer>
          <NetworkSelection />
          <ConnectButton hasIcon={true} text="CONNECT WALLET">
            <AccountDropdown />
          </ConnectButton>
          {!matches && <NotificationDrawer />}
        </ActionBtnContainer>
      </MainContent>
    </DexHeader>
  );
};
