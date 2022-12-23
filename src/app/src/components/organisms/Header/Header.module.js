import { styled } from "@mui/material";

const DexHeader = styled("header")(({ theme }) => ({
  display: "flex",
  width: "100%",
  height: "50px",
  backgroundColor: theme.palette.secondary.dark,
  padding: "0 15px",
  [theme.breakpoints.down("md")]: {
    justifyContent: "space-between"
  },
  justifyContent: "flex-start",
  alignItems: "center",
  position: "sticky",
  top: "0",
  zIndex: "99"
}));
const MainContent = styled("div")(({ show, theme }) => ({
  [theme.breakpoints.down("md")]: {
    position: "fixed",
    justifyContent: "center",
    flexFlow: "column",
    backgroundColor: theme.palette.secondary.dark
  },
  position: "relative",
  zIndex: "999",
  top: "0",
  bottom: "0",
  left: "0",
  right: show ? "0" : "100%",
  display: "flex",
  flex: "1",
  justifyContent: "space-between",
  flexFlow: "row",
  alignItems: "center",
  transition: ".3s",
  overflow: "hidden"
}));
const NavUl = styled("ul")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  listStyle: "none",
  position: "relative",
  paddingInlineStart: "2rem",
  [theme.breakpoints.down("md")]: {
    paddingInlineStart: "0"
  },
  flexFlow: "row",
  alignItems: "center",
  justifyContent: "center"
}));
const NavItem = styled("li")(({ theme }) => ({
  "& a": {
    color: theme.palette.text.primary,
    textDecoration: "none",
    margin: "0 10px",
    position: "relative"
  },
  "& a::after": {
    position: "absolute",
    bottom: "-10px",
    left: "0",
    content: '""',
    width: "0",
    height: "2px",
    backgroundColor: theme.palette.primary.main,
    transition: "all .5s"
  },
  "& a:hover": {
    color: "#fff !important"
  },
  "& a:hover::after": {
    width: "100%",
    color: "#fff !important"
  }
}));
const XSLogoContainer = styled("div")(() => ({
  marginBlock: "13px"
}));
const ActionBtnContainer = styled("div")(({ theme }) => ({
  flexDirection: "column",
  display: "flex",
  [theme.breakpoints.up("md")]: {
    flexDirection: "row"
  },
  alignItems: "center",
  flex: "0.75 1 auto",
  justifyContent: "flex-end"
}));

export { DexHeader, MainContent, NavUl, NavItem, XSLogoContainer, ActionBtnContainer };
