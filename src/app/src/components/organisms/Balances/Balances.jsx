import { networkSelector, userSelector } from "lib/store/features/api/apiSlice";
import { getExplorerUserAddressDetails } from 'lib/utils';
import React from "react";
import { useSelector } from "react-redux";

const Balances = () => {
  const user = useSelector(userSelector);
  const network = useSelector(networkSelector);
  const renderExplorerLink = () => (
    <a href={getExplorerUserAddressDetails(network, user.address)} target="_blank" rel="noreferrer">
      View Account on Explorer
    </a>
  );
  if (!user.balance) {
    return renderExplorerLink();
  }
  return (
    <div>
      <table className="balances_table">
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Balance</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(user.balances)
            .sort()
            .map((token) => {
              let balance = user.balances[token].valueReadable;
              return (
                <tr>
                  <td data-label="Token">{token}</td>
                  <td data-label="Balance">{balance}</td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {renderExplorerLink()}
    </div>
  );
};
export default Balances;
