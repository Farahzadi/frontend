import React, { useEffect, useState } from "react";
import { GoGlobe } from "react-icons/go";
import { networkListSelector, networkSelector } from "lib/store/features/api/apiSlice";
import { useSelector } from "react-redux";
import { FormControl, InputAdornment, MenuItem, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import Core from "lib/api/Core";

const NetFormControl = styled(FormControl)(({ theme }) => ({
  border: `1.5px solid ${theme.palette.primary.main}`,
  borderRadius: "6px",
  minWidth: "200px",
  textAlign: "center",
  paddingInlineStart: "0",
  marginBottom: "10px",
  [theme.breakpoints.up("md")]: {
    marginInlineEnd: "0.25rem",
    marginBlockEnd: "0",
    marginBottom: "0",
  },
  "&:focus": {
    backgroundColor: theme.palette.primary.main,
  },
}));
const NetInput = styled(TextField)(({ theme }) => ({
  paddingLeft: "0",
  transition: "0.2s",
  "& .MuiInputBase-root": {
    paddingLeft: "0",
  },
  "& .MuiSelect-select": {
    paddingLeft: "30px",
  },
  "&:hover": {
    boxShadow: "0px 0px 15px 0px var(--dexpressoPrimery)",
  },
}));
const GlobAdornment = styled(InputAdornment)(() => ({
  position: "absolute",
  left: "10px",
}));
const NetworkSelection = () => {
  const networks = useSelector(networkListSelector);
  const network = useSelector(networkSelector);

  const [selectedNet, setSelectedNet] = useState(network ?? "");
  useEffect(() => {
    Core.run("getNetworks");
  }, []);
  useEffect(() => {
    if (network && networks.length) {
      setSelectedNet(network);
    }
  }, [network, networks]);
  const transformNetName = network => {
    return network.replace("_", " ");
  };

  const handleChangeNetwork = async network => {
    await Core.run("setNetwork", network);
  };

  return (
    <>
      <NetFormControl>
        <NetInput
          size="small"
          value={selectedNet}
          select
          onChange={e => handleChangeNetwork(e.target.value)}
          InputProps={{
            startAdornment: (
              <GlobAdornment position="start">
                <GoGlobe />
              </GlobAdornment>
            ),
          }}>
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
