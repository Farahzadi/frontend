import React, { useEffect, useState } from "react";
import { GoGlobe } from "react-icons/go";
import {
  networkListSelector,
  networkSelector,
} from "lib/store/features/api/apiSlice";
import { useSelector } from "react-redux";
import api from "lib/api";
import {
  FormControl,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const NetFormControl = styled(FormControl)(({ theme }) => ({
  border: `2px solid ${theme.palette.primary.main}`,
  borderRadius: "5px",
  minWidth: "200px",
  textAlign: "center",
  paddingInlineStart: "0",
  marginInlineEnd: "1rem",
  "&:focus": {
    backgroundColor: theme.palette.primary.main,
  },
}));
const NetInput = styled(TextField)(({ theme }) => ({}));
const GlobAdornment = styled(InputAdornment)(() => ({
  position: "absolute",
}));
const NetworkSelection = () => {
  const networks = useSelector(networkListSelector);
  const network = useSelector(networkSelector);

  const [selectedNet, setSelectedNet] = useState("");
  useEffect(() => {
    api.getNetworks();
  }, []);
  useEffect(() => {
    if (network && networks.length) {
      setSelectedNet(network);
    }
  }, [network, networks]);
  const transformNetName = (network) => {
    return network.replace("_", " ");
  };

  const handleChangeNetwork = async (network) => {
    await api.setNetwork(network);
  };

  return (
    <>
      <NetFormControl>
        <NetInput
          size="small"
          value={selectedNet}
          select
          onChange={(e) => handleChangeNetwork(e.target.value)}
          InputProps={{
            startAdornment: (
              <GlobAdornment position="start">
                <GoGlobe />
              </GlobAdornment>
            ),
          }}
        >
          {networks?.map(({ network }, index) => (
            <MenuItem key={network} value={network}>
              {transformNetName(network)}
            </MenuItem>
          ))}
        </NetInput>
      </NetFormControl>
    </>
  );
};

export default NetworkSelection;
