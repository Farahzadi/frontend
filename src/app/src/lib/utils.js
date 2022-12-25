import Decimal from "decimal.js";

export function formatUSD(floatNum) {
  const num = parseFloat(floatNum || 0)
    .toFixed(2)
    .split(".");
  num[0] = parseInt(num[0]).toLocaleString();
  return num.join(".");
}

export function fromBaseUnit(amount, decimals, options) {
  let { precision, zeros } = options ?? {};
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

export function getRatio(price, baseDecimals, quoteDecimals) {
  return {
    base: toBaseUnit("1", baseDecimals),
    quote: toBaseUnit(price, quoteDecimals),
  };
}

export function switchRatio(side, ratio) {
  let sell, buy;
  if (side === "b") {
    buy = ratio.base;
    sell = ratio.quote;
  } else {
    buy = ratio.quote;
    sell = ratio.base;
  }
  return { sell, buy };
}

export function hasOneDayPassed(time) {
  const date = new Date(time);
  const dateString = date.toLocaleDateString();
  let finalDate;
  // get today's date
  var today = new Date().toLocaleDateString();

  // inferring a day has yet to pass since both dates are equal.
  if (dateString === today) {
    var hr = date.getHours();
    var min = date.getMinutes();
    if (min < 10) {
      min = "0" + min;
    }
    var ampm = "am";
    if (hr > 12) {
      hr -= 12;
      ampm = "pm";
    }
    finalDate = hr + ":" + min + ampm;
  }
  if (dateString !== today) {
    var dd = String(date.getDate()).padStart(2, "0"); // day
    var mm = String(date.getMonth() + 1).padStart(2, "0"); // month - January is equal to 0!
    var yyyy = date.getFullYear(); // year

    finalDate = dd + "/" + mm + "/" + yyyy;
  }
  return finalDate;
}

export function getOrderDetailsWithoutFee(order) {
  const side = order.side;
  const baseQuantity = new Decimal(order.baseQuantity);
  const price = new Decimal(order.price);
  const quoteQuantity = price.mul(baseQuantity);
  let fee = order.feeAmount ? order.feeAmount : 0;
  const remaining = isNaN(Number(order.remaining))
    ? order.baseQuantity
    : order.remaining;
  const orderStatus = order.status;
  const orderType = order.type;
  let baseQuantityWithoutFee,
    quoteQuantityWithoutFee,
    priceWithoutFee,
    remainingWithoutFee;

  if (side === "s") {
    if (orderType === "l") {
      baseQuantityWithoutFee = baseQuantity;
      remainingWithoutFee = Math.max(0, remaining);
      priceWithoutFee = quoteQuantity.dividedBy(baseQuantity);
      quoteQuantityWithoutFee = quoteQuantity;
    } else {
      baseQuantityWithoutFee = baseQuantity.minus(fee);
      if (orderStatus === "o" || orderStatus === "c" || orderStatus === "m") {
        remainingWithoutFee = baseQuantity.minus(fee);
      } else {
        remainingWithoutFee = Math.max(0, remaining - fee);
      }
      priceWithoutFee = quoteQuantity.dividedBy(baseQuantityWithoutFee);
      quoteQuantityWithoutFee = priceWithoutFee.mul(baseQuantityWithoutFee);
    }
  } else {
    if (orderType === "l") {
      baseQuantityWithoutFee = baseQuantity;
      quoteQuantityWithoutFee = quoteQuantity;
      priceWithoutFee = quoteQuantityWithoutFee.dividedBy(baseQuantity);
      remainingWithoutFee = Math.min(baseQuantity, remaining);
    } else {
      quoteQuantityWithoutFee = quoteQuantity.minus(fee);
      priceWithoutFee = quoteQuantityWithoutFee.dividedBy(baseQuantity);
      baseQuantityWithoutFee =
        quoteQuantityWithoutFee.dividedBy(priceWithoutFee);
      if (orderStatus === "o" || orderStatus === "c" || orderStatus === "m") {
        remainingWithoutFee = baseQuantity;
      } else {
        remainingWithoutFee = Math.min(baseQuantityWithoutFee, remaining);
      }
    }
  }
  return {
    price: priceWithoutFee,
    quoteQuantity: quoteQuantityWithoutFee,
    baseQuantity: baseQuantityWithoutFee,
    remaining: remainingWithoutFee,
  };
}

export function getFillDetailsWithoutFee(fill) {
  const time = fill.insertTimestamp;
  const price = new Decimal(parseFloat(fill.price));
  let baseQuantity = fill.amount;
  let quoteQuantity = price.mul(fill.amount);
  const side = fill.side;
  let fee = fill.feeAmount ? fill.feeAmount : 0;

  if (side === "s") {
    baseQuantity -= fee;
  } else if (side === "b") {
    quoteQuantity -= fee;
  }
  const finalTime = hasOneDayPassed(time);
  return {
    price: price,
    quoteQuantity: quoteQuantity,
    baseQuantity: baseQuantity,
    time: finalTime,
  };
}
