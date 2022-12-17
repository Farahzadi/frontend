import Decimal from "decimal.js";
import { BigNumber } from "ethers";
import isString from "lodash/isString";

export function formatUSD(floatNum) {
  const num = parseFloat(floatNum || 0)
    .toFixed(2)
    .split(".");
  num[0] = parseInt(num[0]).toLocaleString();
  return num.join(".");
}

export function fromBaseUnit(amount, decimals, options) {
  const { precision, zeros } = options ?? {};
  zeros = zeros ?? false;
  precision = precision ?? 5;
  const res = Decimal.div(amount, Decimal.pow(10, decimals)).toFixed(
    Decimal.min(precision, decimals).toNumber()
  );
  return zeros ? res : new Decimal(res).toFixed();
}

export function toBaseUnit(value, decimals) {
  return Decimal.mul(value, Decimal.pow(10, decimals)).toFixed(0);
}

export function numStringToSymbol(str, decimals) {
  const lookup = [{ value: 1e6, symbol: "M" }];

  const item = lookup.find((item) => str >= item.value);

  if (!item) return str;
  return (str / item.value).toFixed(decimals) + item.symbol;
}

export const validateNumberInputs = (value) => {
  if (typeof value === "number") {
    return value;
  }
  if (value) {
    return value.replace(/[^0-9.]/g, "");
  } else {
    return value;
  }
};

export class State {
  _state = "";

  onChange;

  set(state) {
    if (!Object.keys(this.constructor).includes(state)) return;
    const prev = this._state;
    this._state = state;
    if (prev !== state) this.onChange?.(state);
  }

  get() {
    return this._state;
  }
}

export function formatBalances(balances, currencies) {
  const result = {};
  for (const ticker in balances) {
    const { decimals } = currencies[ticker];
    const balance = balances[ticker];
    result[ticker] = {
      value: balance,
      valueReadable: fromBaseUnit(balance, decimals),
    };
  }
  return result;
}

export function getCurrentValidUntil() {
  return ((Date.now() / 1000) | 0) + 24 * 3600;
}
