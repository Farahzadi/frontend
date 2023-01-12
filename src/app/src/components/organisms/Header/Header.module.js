import { styled } from "@mui/material";

const DexHeader = styled("header")(({ theme }) => ({
  display: "flex",
  width: "100%",
  height: "50px",
  backgroundColor: theme.palette.secondary.dark,
  padding: "0 15px",
  [theme.breakpoints.down("md")]: {
    justifyContent: "space-between",
  },
  justifyContent: "flex-start",
  alignItems: "center",
  position: "sticky",
  top: "0",
  zIndex: "99",
}));
const MainContent = styled("div")(({ show, theme }) => ({
  [theme.breakpoints.down("md")]: {
    position: "fixed",
    justifyContent: "center",
    flexFlow: "column",
    transform: show ? "0" : "translateX(-250px)",
    backgroundColor: theme.palette.secondary.dark,
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
}));
const NavUl = styled("ul")(({ theme }) => ({
  display: "flex",
  listStyle: "none",
  position: "relative",
  paddingInlineStart: "2rem",
  [theme.breakpoints.down("md")]: {
    paddingInlineStart: "0",
  },
  flexFlow: "row",
  alignItems: "center",
  justifyContent: "center",
}));
const NavItem = styled("li")(({ theme }) => ({
  "& a": {
    color: theme.palette.text.primary,
    textDecoration: "none",
    margin: "0 10px",
    position: "relative",
  },
  "& a::after": {
    position: "absolute",
    bottom: "-10px",
    left: "0",
    content: "\"\"",
    width: "0",
    height: "2px",
    backgroundColor: theme.palette.primary.main,
    transition: "all .5s",
  },
  "& a:hover": {
    color: "#fff !important",
  },
  "& a:hover::after": {
    width: "100%",
    color: "#fff !important",
  },
}));
const XSLogoContainer = styled("div")(() => ({
  marginBlock: "13px",
}));
const ActionBtnContainer = styled("div")(({ theme }) => ({
  flexDirection: "column",
  display: "flex",
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  alignItems: "center",
  flex: "0.75 1 auto",
  justifyContent: "center",
}));
const NotifictionSidebar = styled("button")(({ theme }) => ({
  width: "50px",
  height: "45px",
  alignSelf: "center",
  background: "none",
  border: "1px solid var(--dexpressoPrimery)",
  borderRadius: "5px",
  marginLeft: "0.25rem",
  fontSize: "1.25rem !important",
  color: "#ffffffb8 !important",
  transition: "0.2s !important",

  "&:hover": {
    color: "#fff !important",
    boxShadow: "0px 0px 15px 0px var(--dexpressoPrimery)",
  },
}));
const ResponsiveItems = styled("div")(() => ({
  display: "flex",
  width: "90px",
  justifyContent: "space-between",
}));
const CurrencySelector = styled("div")(() => ({
  width: "37%",
  height: "52px",
  display: "flex",
  alignItems: "center",
  marginLeft: "15px",
  borderRight: "2px solid var(--dexpressoPrimery)",
}));

export {
  DexHeader,
  MainContent,
  NavUl,
  NavItem,
  XSLogoContainer,
  ActionBtnContainer,
  NotifictionSidebar,
  ResponsiveItems,
  CurrencySelector,
};
