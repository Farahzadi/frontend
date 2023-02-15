import React, { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/styles";
import { useSelector } from "react-redux";

import Core from "lib/api/Core";
import { ALLOWANCE_INFO } from "./data";
import { userChainDetailsSelector } from "lib/store/features/api/apiSlice";
import SelectAllowance from "./SelectAllowance";
import { Button } from "components/atoms/Button";
import { DefaultTemplate } from "components/templates/DefaultTemplate";
import CoinSelect from "components/molecules/CoinSelect";
import { maxAllowance } from "lib/api/constants";
import { approve } from "lib/api/Actions";
import ConnectButton from "components/molecules/ConnectButton/ConnectButton";

const Container = styled("div")(({ theme }) => ({
  justifyContent: "center",
  display: "flex",
  alignItems: "center",
  minHeight: "80vh",
  color: theme.palette.secondary.dark,
}));
const InnerContainer = styled("div")(({ theme }) => ({
  padding: "1.25em",
  maxWidth: "min(765px, 100vw)",
  minHeight: "337px",
  margin: "2.5rem auto",
  backgroundColor: "#dadbdc",
  borderRadius: "2rem",
}));
const Header = styled("h2")(() => ({
  marginBottom: "0.5em",
  textAlign: "center",
}));
const Paragraph = styled("p")(() => ({
  marginBottom: "1.2rem",
  textAlign: "justify",
  maxHeight: "500px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  position: "relative",
  paddingBottom: "7px",
}));
const Ellipsis = styled("span")(() => ({
  position: "absolute",
  left: "auto",
  right: "0",
  bottom: "0",
  padding: "2px 5px",
  backgroundColor: "#43434370",
  cursor: "pointer",
  color: "white",
  borderRadius: "3px",
}));
const InputContainer = styled("div")(({ theme }) => ({
  marginBottom: "0.5rem",
  display: "flex",
  flexFlow: "row",
  border: `2px solid ${theme.palette.primary.main}`,
  borderRadius: "24px",
  backgroundColor: "white",
}));
const FormContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "center",
}));
const BtnContainer = styled("div")(() => ({
  marginTop: "1.2rem",
}));

const Allowance = () => {
  const allowances = useSelector(userChainDetailsSelector)?.allowances;
  const [allowance, setAllowance] = useState(0);
  const [preAllowance, setPreAllowance] = useState();
  const [truncated, setTruncated] = useState(true);
  const [allowanceInfo, setAllowanceInfo] = useState(true);
  const [currency, setCurrency] = useState("DAI");
  const [pending, setPending] = useState(false);
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("sm"));
  const allowanceItems = [
    { id: -1, name: "MAX ALLOWANCE" },
    { id: 0, name: "ZERO" },
  ];
  useEffect(() => {
    if (currency) {
      const allowance = allowances?.[currency]?.value;
      if (+allowance < +maxAllowance) {
        setAllowance(0);
        setPreAllowance(0);
      } else {
        setAllowance(-1);
        setPreAllowance(-1);
      }
    }
  }, [currency]);
  useEffect(() => {
    if (truncated) {
      const trimNum = matches ? 320 : 550;
      setAllowanceInfo(ALLOWANCE_INFO.substring(0, trimNum) + "...");
    } else {
      setAllowanceInfo(ALLOWANCE_INFO);
    }
  }, [truncated]);
  const handleCurrencyChange = value => {
    setCurrency(value);
  };
  const handleSubmitAllowance = async () => {
    let approvedValue = 0;
    setPending(true);
    if (preAllowance === allowance) return;
    if (allowance === -1) approvedValue = maxAllowance;
    try {
      const response = await Core.run(approve, currency, approvedValue);
      if (!response) {
        throw new Error();
      }
      toast.success(`Allowance was successfully ${allowance !== -1 ? "revoked" : "set to max"}.`);
    } catch (error) {
      toast.error("Error in revoking allowance");
    }
    setPending(false);
  };
  const handleChangeAllowance = e => setAllowance(e.target.value);
  const setBtnText = () => {
    if (allowance === -1) {
      return "Allowance";
    }
    return "Revoke Allowance";
  };
  return (
    <DefaultTemplate>
      <Container>
        <InnerContainer>
          <Header>Change Allowance Setting</Header>
          <Paragraph>
            {allowanceInfo}
            <Ellipsis
              onClick={() => {
                setTruncated(!truncated);
              }}>
              {truncated ? "Read more >" : " < Close "}
            </Ellipsis>
          </Paragraph>
          <FormContainer>
            <InputContainer>
              <CoinSelect handleCurrencyChange={handleCurrencyChange} currency={currency} />
              <SelectAllowance
                value={allowance}
                items={allowanceItems}
                handleChange={handleChangeAllowance}></SelectAllowance>
            </InputContainer>
          </FormContainer>
          <BtnContainer>
            <ConnectButton>
              <Button
                text={setBtnText()}
                className="bg_btn"
                disabled={pending || allowance === preAllowance}
                loading={pending}
                onClick={handleSubmitAllowance}
              />
            </ConnectButton>
          </BtnContainer>
        </InnerContainer>
      </Container>
    </DefaultTemplate>
  );
};
export default Allowance;
