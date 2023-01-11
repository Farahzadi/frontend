import CoinSelect from "components/molecules/CoinSelect";
import React, { useEffect, useState } from "react";
import { ALLOWANCE_INFO } from "./data";
import { styled } from "@mui/material/styles";
import { DefaultTemplate } from "components/templates/DefaultTemplate";
import { Button } from "components/atoms/Button";
import { useSelector } from "react-redux";
import { balancesSelector } from "lib/store/features/api/apiSlice";
import { validateNumberInputs } from "lib/utils";
import api from "lib/api";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/styles";
import { userChainDetailsSelector } from "lib/store/features/api/apiSlice";
import Core from "lib/api/Core";

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
const Input = styled("input")(({ theme }) => ({
  border: "none",
  height: "52px",
  minWidth: theme.breakpoints.down("sm") ? "100px" : "160px",
  maxWidth: theme.breakpoints.down("sm") ? "min(150px, 100vw - 175px)" : "160px",
  textAlign: "right",
  borderTopRightRadius: "24px",
  borderBottomRightRadius: "24px",
  borderLeft: `2px solid ${theme.palette.primary.main}`,
  padding: "0.3rem 1.2rem",
  fontSize: "1.25rem",
  "&:focus": {
    outline: "none",
  },
}));
const Diff = styled("div")(() => ({
  marginBottom: "0.25rem",
  textAlign: "center",
  fontSize: "0.95rem",
  "& span": {
    fontWeight: "bold",
  },
}));
const BtnContainer = styled("div")(() => ({
  marginTop: "1.2rem",
}));

const Allowance = () => {
  const allowances = useSelector(userChainDetailsSelector)?.allowances;
  const [allowance, setAllowance] = useState("");
  const [preAllowance, setPreAllowance] = useState();
  const [truncated, setTruncated] = useState(true);
  const [allowanceInfo, setAllowanceInfo] = useState(true);
  const [currency, setCurrency] = useState("ETH");
  const [pending, setPending] = useState(false);
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("sm"));
  useEffect(() => {
    if (currency) {
      setAllowance(allowances?.[currency]?.allowance?.valueReadable?.toString() || "");
      setPreAllowance(+allowances?.[currency]?.allowance?.valueReadable?.toString() || "");
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
  const handleSetAllowance = e => {
    const value = validateNumberInputs(e.target.value);
    setAllowance(value);
  };
  const handleSubmitAllowance = async () => {
    setPending(true);
    await Core.run("approve", currency, allowance)
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        setPending(false);
      });
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

              <Input type="text" placeholder="0.00" value={allowance} onChange={handleSetAllowance} />
            </InputContainer>
          </FormContainer>

          <Diff>
            {+allowance !== +preAllowance ? (
              <div>
                {` You're about to ${allowance > preAllowance ? "increase" : "decrease"} your allowance by `}
                <span>{Math.abs(allowance - preAllowance) || 0}</span> {currency}
              </div>
            ) : (
              <span> Allowance has not been changed. </span>
            )}
          </Diff>
          <BtnContainer>
            <Button
              text="Accept"
              className="bg_btn"
              disabled={pending || allowance === preAllowance}
              loading={pending}
              onClick={handleSubmitAllowance}
            />
          </BtnContainer>
        </InnerContainer>
      </Container>
    </DefaultTemplate>
  );
};
export default Allowance;
