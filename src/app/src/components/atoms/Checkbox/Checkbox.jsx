import { styled } from "@mui/system";
import React from "react";

const Label = styled("label")(() => ({
  position: "relative",
  padding: ".5rem",
  display: "flex",
  alignItems: "center",
}));
const Input = styled("input")(() => ({
  position: "absolute",
  top: "0",
  left: "0",
  right: "0",
  bottom: "0",
  opacity: "0",
  fontSize: "1rem",
  overflow: "hidden",
  cursor: "pointer",
}));
const CheckboxBtn = styled("button")(({ theme, checked }) => ({
  background: "inherit",
  border: "1px solid gray",
  borderRadius: "5px",
  width: "20px",
  height: "20px",
  position: "relative",
  marginInlineEnd: ".7rem",
  "&::before": {
    content: checked && "' '",
    display: "block",
    position: "absolute",
    right: "5px",
    bottom: "2px",
    background: theme.palette.primary.main,
    width: "4px",
    height: "16px",
    transform: "rotate(-30deg)",
    transformOrigin: "right bottom",
    borderRadius: "10px",
  },
  "&::after": {
    content: checked && "' '",
    display: "block",
    position: "absolute",
    right: "6px",
    bottom: "2px",
    width: "5px",
    height: "27px",
    background: theme.palette.primary.main,
    transform: "rotate(37deg)",
    transformOrigin: "right bottom",
    borderRadius: "10px",
  },
}));
const Checkbox = ({ name, checked, onChange, label }) => {
  return (
    <Label>
      <CheckboxBtn checked={checked}></CheckboxBtn>
      <Input type="checkbox" name={name} checked={checked} onChange={onChange} />
      {label}
    </Label>
  );
};

export default Checkbox;
