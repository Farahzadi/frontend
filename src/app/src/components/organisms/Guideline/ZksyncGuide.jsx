import React, { useState } from "react";
import { styled } from "@mui/system";
import { ZksyncActivationStages } from "lib/interface";
import { zksyncActivationStageSelector } from "lib/store/features/api/apiSlice";
import { useSelector } from "react-redux";
import loadingGif from "assets/icons/loading.svg";
import { createPortal } from "react-dom";

const Modal = styled("div")(({ theme }) => ({
  position: "fixed",
  left: "15px",
  bottom: "15px",
  background: theme.palette.secondary.dark,
  borderRadius: "7px",
  zIndex: "99",
  color: theme.palette.text.primary,
  border: `1px solid ${theme.palette.primary.main}`,
  boxShadow: "0px 0px 20px 0px #3e4c52",
  display: "flex",
  flexFlow: "column",
  justifyContent: "center",
}));
const ModalHeader = styled("div")(() => ({
  padding: "15px 15px 13px",
  borderBottom: "1px solid gray",
  color: "#fff",
}));
const ModalTitle = styled("h5")(() => ({
  display: "inline-block",
}));
const ModalBody = styled("div")(({ theme, isMinimized }) => ({
  height: isMinimized ? "0" : "auto",
  overflow: "hidden",
}));
const Minimize = styled("div")(({ theme, isMinimized }) => ({
  width: "27px",
  height: "27px",
  borderRadius: "50%",
  position: "relative",
  float: "right",
  cursor: "pointer",
  "&::after, &::before": {
    content: "''",
    background: "#fff",
    height: "20px",
    width: "3px",
    position: "absolute",
    right: "calc(50% - 3px)",
    top: "3px",
    transition: "transform",
  },
  "&::after": {
    transform: isMinimized ? "rotate(90deg)" : "rotate(45deg)",
  },
  "&::before": {
    transform: isMinimized ? "rotate(-90deg)" : "rotate(-45deg)",
  },
}));
const StageItem = styled("div")(({ theme }) => ({
  padding: "23px 23px 17px",
  borderBottom: `1px solid ${theme.palette.primary.dark}`,
  "&:last-child": {
    borderBottom: "none",
  },
}));
const StageTitle = styled("h6")(({ theme }) => ({
  display: "flex",
  padding: "",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "13px",
  color: "#fff",
}));
const StageDescription = styled("p")(({ theme }) => ({}));
const Check = styled("div")(({ theme, done }) => ({
  border: "1px solid gray",
  borderRadius: "4px",
  width: "17px",
  height: "17px",
  position: "relative",
  "&::before": {
    display: "block",
    position: "absolute",
    right: "5px",
    bottom: "2px",
    content: done && "' '",
    background: theme.palette.primary.main,
    width: "4px",
    height: "16px",
    transform: "rotate(-30deg)",
    transformOrigin: "right bottom",
    borderRadius: "10px",
  },
  "&::after": {
    content: done && "' '",
    display: "block",
    position: "absolute",
    right: "5px",
    bottom: "2px",
    width: "5px",
    height: "30px",
    background: theme.palette.primary.main,
    transform: "rotate(37deg)",
    transformOrigin: "right bottom",
    borderRadius: "10px",
  },
}));
const ZksyncGuide = () => {
  const stage = useSelector(zksyncActivationStageSelector);
  const stages = [
    {
      id: "DEPOSIT",
      isInProgress: () => stage === ZksyncActivationStages.DEPOSITTING,
      isDone: () => stage !== ZksyncActivationStages.MUST_DEPOSIT && stage !== ZksyncActivationStages.UNKNOWN,
      title: "Deposit",
      description: "You have to deposit first.",
      link: "/bridge",
    },
    {
      id: "ACTIVATE",
      isInProgress: () => stage === ZksyncActivationStages.ACTIVATING,
      isDone: () => !stage,
      title: "Activation",
      description: "Please activate your account.",
    },
  ];
  const [isMinimized, setIsMinimized] = useState(false);
  if (!stage || stage === "UNKNOWN") {
    return null;
  }
  return createPortal(
    <Modal>
      <ModalHeader>
        <ModalTitle>Account Activation</ModalTitle>
        <Minimize isMinimized={isMinimized} onClick={() => setIsMinimized(!isMinimized)}></Minimize>
      </ModalHeader>
      <ModalBody isMinimized={isMinimized}>
        {stages.map((val, index) => (
          <StageItem>
            <StageTitle>
              {val.title}
              {val.isInProgress() ? (
                <img width={35} height={35} src={loadingGif} alt="Pending" />
              ) : (
                <Check done={val.isDone()}></Check>
              )}
            </StageTitle>
            <StageDescription>{val.description}</StageDescription>
          </StageItem>
        ))}
      </ModalBody>
    </Modal>,
    document.body,
  );
};

export default ZksyncGuide;
