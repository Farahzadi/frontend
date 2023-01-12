import { styled } from "@mui/system";
import { networkSelector, userSelector } from "lib/store/features/api/apiSlice";
import { getExplorerLink, getExplorerUserAddressDetails } from "lib/utils";
import React from "react";
import { useSelector } from "react-redux";

const ExplorerLink = styled("a")(({ theme }) => ({
  position: "absolute",
  bottom: "10px",
  right: "13px",
  color: theme.palette.primary.main,
  "&:hover": {
    color: theme.palette.primary.main,
  },
}));
export const UserAddressExplorerLink = () => {
  const user = useSelector(userSelector);
  const network = useSelector(networkSelector);
  return (
    <ExplorerLink href={getExplorerUserAddressDetails(network, user.address)} target="_blank" rel="noreferrer">
      View Account on Explorer
    </ExplorerLink>
  );
};

export const TxExplorerLink = ({ txHash = "" }) => {
  const network = useSelector(networkSelector);
  return (
    <a href={getExplorerLink(network) + txHash} target="_blank" rel="noreferrer">
      View Tx
    </a>
  );
};
