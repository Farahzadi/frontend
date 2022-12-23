import React, { useEffect, useState } from 'react';
import { GoGlobe } from 'react-icons/go';
import {
  networkListSelector,
  networkSelector,
} from 'lib/store/features/api/apiSlice';
import { useSelector } from 'react-redux';
import api from 'lib/api';
import {
  FormControl,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const NetFormControl = styled(FormControl)(({ theme }) => ({
  border: `1.5px solid ${theme.palette.primary.main}`,
  borderRadius: '6px',
  minWidth: '200px',
  textAlign: 'center',
  paddingInlineStart: '0',
  marginBlockEnd: '3rem',
  [theme.breakpoints.up('md')] : {
    marginInlineEnd: '1rem',
    marginBlockEnd: '0'
  },
  '&:focus': {
    backgroundColor: theme.palette.primary.main,
  },
}));
const NetInput = styled(TextField)(({ theme }) => ({
  paddingLeft: '0',
  '& .MuiInputBase-root': {
    paddingLeft: '0',
  },
  '& .MuiSelect-select': {
    paddingLeft: '30px',
  },
}));
const GlobAdornment = styled(InputAdornment)(() => ({
  position: 'absolute',
  left: '10px',
}));
const NetworkSelection = () => {
  const networks = useSelector(networkListSelector);
  const network = useSelector(networkSelector);

  const [selectedNet, setSelectedNet] = useState(network ?? "");
  useEffect(() => {
    api.getNetworks();
  }, []);
  useEffect(() => {
    if (network && networks.length) {
      setSelectedNet(network);
    }
  }, [network, networks]);
  const transformNetName = (network) => {
    return network.replace('_', ' ');
  };

  const handleChangeNetwork = async (network) => {
    await api.setNetwork(network);
  };

  return (
    <>
      <NetFormControl>
        <NetInput
          size='small'
          value={selectedNet}
          select
          onChange={(e) => handleChangeNetwork(e.target.value)}
          InputProps={{
            startAdornment: (
              <GlobAdornment position='start'>
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
