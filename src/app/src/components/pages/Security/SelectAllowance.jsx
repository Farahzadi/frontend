import { FormControl, MenuItem, Select, styled } from "@mui/material";
import React from "react";

const AllowanceForm = styled(FormControl)(({ theme }) => ({
  color: "inherit",
  width: "182px",
  textAlign: "center",
  borderLeft: `2px solid ${theme.palette.primary.main}`,
  "& .MuiSvgIcon-root": {
    color: "inherit",
  },
}));
const SelectAllowance = ({ value, handleChange, label, items }) => {
  return (
    <AllowanceForm>
      <Select
        labelId={"allowance-select"}
        id={"allowance-select"}
        value={value}
        onChange={handleChange}
        label={"Allowance"}>
        {items.map(({ id, name }) => (
          <MenuItem key={id} value={id}>{name}</MenuItem>
        ))}
      </Select>
    </AllowanceForm>
  );
};
export default SelectAllowance;
