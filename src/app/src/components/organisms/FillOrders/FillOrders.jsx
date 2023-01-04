import { networkSelector, userFillsSelector } from 'lib/store/features/api/apiSlice';
import React from "react";
import { useSelector } from 'react-redux';

const FillOrders = () => {
  const cols = ["Market", "Time", "Price", "Volume", "Side", "Fee", "Status", "Action"];
  const userFillOrders = useSelector(userFillsSelector);
  const network = useSelector(networkSelector);
  const getFills = () => {
    let fills = Object.values(userFillOrders).sort((a, b) => b.id - a.id);
    return fills.filter((fill) => {
      return activeFillStatus.includes(fill.status);
    });
  }
  return (
    <table>
      <thead>
        <tr>
          {cols.map((col) => (
            <th scope="col">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {getFills().map((fill, i) => {
          let date;
          const { id, market, isTaker, side, status, txHash, price } = fill;

          let amount = new Decimal(fill.amount);
          {
            /* const side = (fill.takerSide === "b") ^ !isTaker ? "b" : "s"; */
          }
          const baseCurrency = fill.market.split("-")[0];
          const quoteCurrency = fill.market.split("-")[1];
          const sideClassName = side === "b" ? "up_value" : "down_value";
          const time = fill.insertTimestamp;
          const quantity = amount.mul(price);

          let fee = new Decimal(isTaker ? fill.takerFee : fill.makerFee);
          fee = fee.mul(side === "b" ? quantity : amount);

          const feeCurrency = side === "b" ? quoteCurrency : baseCurrency;

          date = hasOneDayPassed(time);

          let feeText;
          const fillWithoutFee = getFillDetailsWithoutFee(fill);

          if (["zksyncv1", "zksyncv1_goerli"].includes(network)){
            feeText = "0 " + baseCurrency;
            price = fillWithoutFee.price;
            amount = fillWithoutFee.baseQuantity;
          }
          else {
            feeText = fee.toFixed() + " " + feeCurrency;
          }

          return (
            <tr key={id}>
              <td data-label="Market">{market}</td>
              <td data-label="Time">{date}</td>
              <td data-label="Price">{price.toPrecision(6) / 1}</td>
              <td data-label="Quantity">
                {amount.toPrecision(6) / 1} {baseCurrency}
              </td>
              <td className={sideClassName} data-label="Side">
                <OrderSideItem side={side}>{OrderSide[side]}</OrderSideItem>
              </td>
              <td data-label="Fee">{feeText}</td>
              <td data-label="Order Status">
                <OrderStatusItem status={orderStatus}>{OrderStatus[status]}</OrderStatusItem>
              </td>
              <td data-label="Action">
                {txHash && (
                  <a
                    href={getExplorerLink(network) + txHash}
                    target="_blank"
                    rel="noreferrer">
                    View Tx
                  </a>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default FillOrders;