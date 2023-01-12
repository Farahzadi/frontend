import React from "react";
import Input from "./Input";
import BaseInputStyle from "./BaseInput.style";

const NumberInput = ({ name, placeholder, validate, block, label, value, onChange, hideValidation, rightOfLabel }) => {
  return (
    <Input
      name={name}
      placeholder={placeholder}
      validate={validate}
      label={label}
      value={value}
      onChange={onChange}
      hideValidation={hideValidation}
      rightOfLabel={rightOfLabel}
      type={"number"}
      w={block ? "100%" : "inherit"}
      {...BaseInputStyle}
    />
  );
};

export default NumberInput;
