import { styled } from "@mui/system";
import React from "react";

const Button = styled("button")(({}) => ({
  border: "none",
  outline: "none"
}));
const Tabs = ({ items, selected, handleSelect }) => {
  return (
    <div>
      {items.map(({ name, id }) => (
        <Button type="button" onClick={() => handleSelect(id)}>
          {name}
          {/* need to fix */}
          {/* <span>{info}</span> */}
        </Button>
      ))}
    </div>
  );
};
export default Tabs;
