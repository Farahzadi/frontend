import { styled } from "@mui/material";
import theme from "lib/muiTheme";
import react from "react";
const Container = styled("div")(({ theme }) => ({
  display: "flex",
  flexFlow: "column",
  alignItems: "center",
  cursor: "pointer",
  position: "relative",
  zIndex: "9999",
}));
const Rect = styled("div")(({ isClicked, theme }) => ({
  position: "absolute",
  top: "50%",
  right: "30%",
  width: "24px",
  height: "2px",
  borderRadius: "1px",
  background: theme.palette.text.primary,
  transition: "all ease-in-out 0.5s",
  "&:nth-child(1)": {
    transform: isClicked ? "rotate(40deg)" : "translateY(-7px)",
  },
  "&:nth-child(2)": {
    background: theme.palette.text.primary,
    // opacity: "0.6",
    opacity: isClicked ? "0" : "1",
  },
  "&:nth-child(3)": {
    background: theme.palette.text.primary,
    opacity: "0.5",
    transform: isClicked ? "rotate(140deg)" : "translateY(7px)",
  },
}));
const HamburgerIcon = ({ isClicked, handleClick }) => {
  return (
    <Container onClick={handleClick}>
      {[1, 2, 3].map((rect, index) => (
        <Rect key={index} isClicked={isClicked} />
      ))}
    </Container>
  );
};

export default HamburgerIcon;
