const { styled } = require("@mui/system");

export const MainContainer = styled("div")(({ theme }) => ({
  height: "100%",
  position: "relative",
  color: "#3d4a52",
  borderColor: "#3d4a52",
}));
export const Header = styled("div")(({ theme }) => ({
  borderBottom: "1px solid #555c61",
}));
export const TableContainer = styled("div")(({ hasAction }) => ({
  overflow: "auto",
  height: hasAction ? "calc(100% - 76px)" : "calc(100% - 43px)",
}));
export const Table = styled("table")(({ theme }) => ({
  width: "100%",
  fontFamily: "inherit",
  color: theme.palette.text.primary,
}));
export const Thead = styled("thead")(({ theme }) => ({}));

export const Th = styled("th")(({ theme }) => ({
  textTransform: "capitalize",
  color: theme.palette.text.primary,
  textAlign: "center",
}));
export const InnerTh = styled("div")(() => ({
  padding: "5px 10px",
  borderBottom: "1px solid #3d4a52",
}));
export const Tr = styled("tr")(({ theme }) => ({
  "&:hover": {
    color: theme.palette.text.secondary,
    cursor: "pointer",
    backgroundColor: "#2B3E5A",
  },
}));
export const Td = styled("td")(() => ({
  padding: "10px",
  textAlign: "center",
}));

export const CancelOrderBtn = styled("button")(({ theme }) => ({
  textDecoration: "underline",
  cursor: "pointer",
  fontSize: "0.9rem",
  border: "none",
  outline: "none",
  background: "inherit",
  color: "inherit",
  "&:hover": {
    color: theme.palette.error.main,
  },
}));
export const ActionBar = styled("div")(() => ({
  display: "flex",
  flexFlow: "row-reverse",
  fontSize: ".9rem",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "inherit",
  color: "#69747a",
}));
export const ActionBtn = styled("button")(({ theme }) => ({
  backgroundColor: "inherit",
  border: "none",
  color: "inherit",
  outline: "none",
  padding: "5px",
  borderInlineStart: "1px solid gray",
  borderColor: "inherit",
  "&:hover": {
    backgroundColor: theme.palette.error.main,
    color: "#fff",
  },
}));
