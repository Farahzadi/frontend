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
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const NetFormControl = withStyles(({ palette }) => ({
  root: {
    border: `2px solid ${palette.primary.main}`,
    borderRadius: '5px',
    minWidth: '200px',
    textAlign: 'center',
    paddingInlineStart: '0.5rem',
    marginInlineEnd: '1rem'
  },
}))(FormControl);

const NetworkSelection = () => {
  const networks = useSelector(networkListSelector);
  const network = useSelector(networkSelector);
  const [selectedNet, setSelectedNet] = useState('');
  useEffect(() => {
    api.getNetworks();
  }, []);
  useEffect(() => {
    if (network && networks.length) {
      setSelectedNet(network);
    }
  }, [network, networks])
  const transformNetName = (network) => {
    return network.replace('_', ' ');
  };

  const handleChangeNetwork = (net) => {
    api.setAPIProvider(net);
    api.refreshNetwork().catch((err) => {
      console.log(err);
    });
  };
  return (
    <>
      <NetFormControl>
        <TextField
          value={selectedNet}
          select
          onChange={(e) => handleChangeNetwork(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <GoGlobe />
              </InputAdornment>
            ),
          }}
        >
          {networks?.map(({ network }, index) => (
            <MenuItem key={network} value={network}>
              {transformNetName(network)}
            </MenuItem>
          ))}
        </TextField>
      </NetFormControl>
    </>
  );
};

export default NetworkSelection;
