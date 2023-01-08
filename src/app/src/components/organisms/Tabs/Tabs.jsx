import { styled } from "@mui/system";
import React from "react";

const Button = styled("button")(({active, theme}) => ({
  border: "none",
  outline: "none",
  backgroundColor: "inherit",
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  fontWeight: "500",
  fontSize: "0.9rem",
  padding: "0 1.5rem",
  textTransform: "uppercase",
  borderInlineEnd: "1px solid #b2bfc7",
  "&:last-child": {
    border: "none"
  }
}));
const Badge = styled("span")(() => ({

}))
const Tabs = ({ items, selected, handleSelect, ordersNum }) => {
  if (!items.map) {
    items = Object.keys(items).map(val => {return {...items[val], id: val}})
  }
  return (
    <div>
      {items.map(({ name, id }) => (
        <Button key={id} active={selected===id} type="button" onClick={() => handleSelect(id)}>
          {name}
          <span>{ordersNum?.[id]}</span>
        </Button>
      ))}
    </div>
  );
};
export default Tabs;
