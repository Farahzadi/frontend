import { networkSelector } from 'lib/store/features/api/apiSlice';
import React from 'react';
import { useSelector } from 'react-redux';
import NonceIncreasement from '../NonceIncreasement/NonceIncreasement';
import Allowance from './Allowance';

const Security = () => {
  const network = useSelector(networkSelector);

  if (network === 0) {
    return <Allowance />;
  } else {
    return <NonceIncreasement />;
  }
};

export default Security;
