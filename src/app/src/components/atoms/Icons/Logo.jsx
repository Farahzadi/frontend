import { styled } from "@mui/material";
import React from "react";
import { NavLink } from "react-router-dom";

const ContainerLink = styled(NavLink)(() => ({
  display: "flex",
  alignItems: "flex-end",
  textDecoration: "none",
  color: "inherit",
  "&:hover": {
    textDecoration: "none",
    color: "inherit",
  },
}));
const BrandName = styled("span")(() => ({
  display: "inlineBlock",
  letterSpacing: "1.5px",
  fontSize: "1.47rem",
  fontWeight: "900",
  "-webkit-margin-start": "5px",
  marginInlineStart: "5px",
  fontFamily: "Ostrich Sans",
  lineHeight: "30px",
}));
export const BrandLogo = () => {
  return (
    <ContainerLink exact to="/">
      <Logo />
      <BrandName>DEXPRESSO</BrandName>
    </ContainerLink>
  );
};

export const Logo = ({ isTheme, width = 28, height = 39, fill = "#FCF5ED" }) => {
  return (
    <svg
      width={width}
      height={height}
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 342.2 477.7"
      style={{ enableBackground: "new 0 0 342.2 477.7", margin: "3px   " }}>
      <g fill={fill}>
        <path
          d="M342.2,133.1v211.5c0,53.2-13.2,88.7-39.5,106.5c-26.3,17.8-67.7,26.6-124.3,26.6H17.7
                    C5.9,477.7,0,468.8,0,451.1V26.6C0,8.9,5.9,0,17.7,0h165.2c26.6,0,48.7,1.6,66.4,4.8s34,9.5,49,18.9s26,23.1,33.2,41
                    C338.6,82.7,342.2,105.5,342.2,133.1L342.2,133.1z M292,140c0,0-8.1,233.8-243.3,283C48.7,423.1,359,516.2,292,140z"
        />
      </g>
    </svg>
  );
};
