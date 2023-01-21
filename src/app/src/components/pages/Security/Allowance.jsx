import CoinSelect from "components/molecules/CoinSelect";
import React, { useEffect, useState } from "react";
import { ALLOWANCE_INFO } from "./data";
import { styled } from "@mui/material/styles";
import { DefaultTemplate } from "components/templates/DefaultTemplate";
import { Button } from "components/atoms/Button";
import { useSelector } from "react-redux";
import { balancesSelector, userChainDetailsSelector } from "lib/store/features/api/apiSlice";
import { validateNumberInputs } from "lib/utils";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/styles";
import Core from "lib/api/Core";
import { BigNumber } from "ethers";
import SelectAllowance from "./SelectAllowance";

const MAX_ALLOWANCE = BigNumber.from(2).pow(256).sub(1);
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
  const [allowance, setAllowance] = useState(0);
  const [preAllowance, setPreAllowance] = useState();
  const [truncated, setTruncated] = useState(true);
  const [allowanceInfo, setAllowanceInfo] = useState(true);
  const [currency, setCurrency] = useState("ETH");
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
      if (+allowance < +MAX_ALLOWANCE) {
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
    if (preAllowance === allowance) {
      return;
    }
    if (allowance === -1) {
      approvedValue = MAX_ALLOWANCE;
    }

    await Core.run("approve", currency, approvedValue)
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        setPending(false);
      });
  };
  const handleChangeAllowance = e => {
    setAllowance(e.target.value);
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

          {/* <Diff>
            {+allowance !== +preAllowance ? (
              <div>
                {` You're about to ${allowance > preAllowance ? "increase" : "decrease"} your allowance by `}
                <span>{Math.abs(allowance - preAllowance) || 0}</span> {currency}
              </div>
            ) : (
              <span> Allowance has not been changed. </span>
            )}
          </Diff> */}
          <BtnContainer>
            <Button
              text="Revoke Allowance"
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
