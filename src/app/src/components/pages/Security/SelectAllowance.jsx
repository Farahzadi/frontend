import { FormControl, InputBase, MenuItem, Select, styled } from "@mui/material";
import React from "react";
import { FiChevronDown } from "react-icons/fi";

const AllowanceForm = styled(FormControl)(({ theme }) => ({
  width: "200px",
  textAlign: "center",
  borderLeft: `2px solid ${theme.palette.primary.main}`,
  fontSize: "1.2rem",
}));
const AllowanceSelect = styled(Select)(() => ({
  color: "#000",
  "& .MuiInputBase-input": {
    color: "#000",
  },
}));
const Chevron = styled(FiChevronDown)(() => ({
  position: "absolute",
  right: "10px",
  left: "auto",
  top: "calc(50% - 10.2px)",
  fontSize: "1.2rem",
}));
const SelectAllowance = ({ value, handleChange, items }) => {
  return (
    <AllowanceForm>
      <AllowanceSelect
        labelId={"allowance-select"}
        id={"allowance-select"}
        value={value}
        onChange={handleChange}
        label={"Allowance"}
        IconComponent={() => <Chevron />}>
        {items.map(({ id, name }) => (
          <MenuItem key={id} value={id}>{name}</MenuItem>
        ))}
      </AllowanceSelect>
    </AllowanceForm>
  );
};
export default SelectAllowance;
