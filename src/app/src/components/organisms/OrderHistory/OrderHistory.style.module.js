const { styled } = require('@mui/system');

export const MainContainer = styled("div")(() => ({
    maxHeight: "100%",
    position: "relative",
    overflow: "hidden"
}))
export const Header = styled("div")(({theme}) => ({
    borderBottom: `1px solid #3d4a52`,
    paddingBlock: "0.7rem"
}));
export const CancelOrderBtn = styled("button")(({theme}) => ({
    backgroundColor: theme.palette.error.main,
    border: `1px solid ${theme.palette.error.main}`,
    color: theme.palette.text.primary,
    borderRadius: "5px",
    position: "absolute",
    bottom: "10px",
    right: "10px",
    outline: "none",
    padding: "5px"

}));
export const TableContainer = styled("div")(() => ({
    overflow: "auto",
    height: "100%"
}))
export const Table = styled("table")(({theme}) => ({
    width: "100%",
    fontFamily: "inherit",
    color: theme.palette.text.primary,
}));
export const Thead = styled("thead")(({theme}) => ({
    borderBottom: `1px solid #3d4a52`,
}));

export const Th = styled("th")(({theme}) => ({
    textTransform: "uppercase",
    padding: "10px",
    color: theme.palette.text.primary,
    textAlign: "center"
}));
export const Tr = styled("tr")(({theme}) => ({
    "&:hover": {
        color: theme.palette.text.secondary,
        cursor: "pointer",
        backgroundColor: "#2B3E5A"
    }
}))
export const Td = styled("td")(() => ({
    padding: "10px",
    textAlign: "center"
}))