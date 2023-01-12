import { styled } from "@mui/system";
import React from "react";

const Button = styled("button")(({active, theme}) => ({
  border: "none",
  outline: "none",
  backgroundColor: "inherit",
  color: active ? theme.palette.text.primary : "#686a6d",
  fontWeight: "500",
  fontSize: "0.9rem",
  paddingBlock: "0.5rem",
  textTransform: "uppercase",
  "&:last-child > div": {
    border: "none"
  },
  "&:hover": {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.text.primary,
  },
  "&:hover  span": {
    backgroundColor: theme.palette.primary.main,
  }
}));
const Badge = styled("span")(({active, theme}) => ({
  display: "inline-block",
  marginInlineStart: "7px",
  padding: "2px 7px",
  backgroundColor: theme.palette.secondary.main,
  borderRadius: "10px",
  minWidth: "30px",
  color: theme.palette.text.primary,
}));
const InnerBlock = styled("div")(() => ({
  padding: "0 1.5rem",
  borderInlineEnd: "1px solid #b2bfc7",

}))
const Tabs = ({ items, selected, handleSelect, ordersNum }) => {
  if (!items.map) {
    items = Object.keys(items).map(val => {return {...items[val], id: val}})
  }
  return (
    <>
      {items.map(({ name, id }) => (
        <Button key={id} active={selected===id} type="button" onClick={() => handleSelect(id)}>
          <InnerBlock>
            {name}
            {ordersNum?.[id] !== undefined && <Badge active={selected===id}>{ordersNum?.[id]}</Badge>}
          </InnerBlock>
        </Button>
      ))}
    </>
  );
};
export default Tabs;
