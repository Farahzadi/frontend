import { networkSelector, userSelector } from 'lib/store/features/api/apiSlice';
import { getExplorerLink, getExplorerUserAddressDetails } from 'lib/utils';
import React from 'react';
import { useSelector } from 'react-redux';

export const UserAddressExplorerLink = () => {
    const user = useSelector(userSelector);
    const network = useSelector(networkSelector);
    return (
        <a href={getExplorerUserAddressDetails(network, user.address)} target="_blank" rel="noreferrer">
        View Account on Explorer
      </a>
    )
};

export const TxExplorerLink = ({txHash = ""}) => {
  const network = useSelector(networkSelector);
  return (
    <a href={getExplorerLink(network) + txHash} target="_blank" rel="noreferrer">
      View Tx
    </a>
  );
}