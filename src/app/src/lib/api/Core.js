import Decimal from "decimal.js";
import { createIcon } from "@download/blockies";
import Emitter from "tiny-emitter";

import { getENSName } from "lib/ens";
import { formatAmount } from "lib/utils";
import erc20ContractABI from "lib/contracts/ERC20.json";
import { maxAllowance } from "./constants";
import axios from "axios";
import { toast } from "react-toastify";

const DEFAULT_NETWORK = process.env.REACT_APP_DEFAULT_NETWORK;

export default class Core extends Emitter {
  networkClasses = {};
  network = DEFAULT_NETWORK || "zksyncv1_goerli";
  networkInterface = null;
  ws = null;
  currencies = null;
  websocketUrl = null;
  _profiles = {};
  lastSocketOpenState = false;

  constructor({
    infuraId,
    websocketUrl,
    apiUrl,
    networkClasses,
    currencies,
    validMarkets,
    signInMessage,
  }) {
    super();

    this.networkClasses = networkClasses;
    this.networkInterface = null;
    this.network = null;

    this.infuraId = infuraId;
    this.websocketUrl = websocketUrl;
    this.apiUrl = apiUrl;
    this.currencies = currencies;
    this.validMarkets = validMarkets;
    this.axiosInstance = axios.create({
      baseURL: apiUrl,
      timeout: 3000,
    });
    this.signInMessage = signInMessage ?? "Login to Dexpresso";
  }

  setNetwork = async (network) => {
    if (this.network === network) return;
    await this.stopNetworkInterface();
    try {
      this.networkInterface = this.initiateNetworkInteface(network);
    } catch (err) {
      console.log(err);
      return;
    }
    this.network = network;
    this.emit("networkChange", {
      name: network,
      ...this.networkInterface.getConfig(),
    });
  };

  connectWallet = async () => {
    console.log("connect try", this.network, this.networkInterface);
    if (this.network) await this.networkInterface?.connectWallet();
  };

  disconnectWallet = async () => {
    await this.networkInterface?.disconnectWallet();
  };

  onProviderStateChange = (state) => {
    this.emit("providerStateChange", state);
  };

  initiateNetworkInteface = (network) => {
    const NetworkClass = this.networkClasses[network];
    if (!NetworkClass) throw new Error("Network not found");
    return new NetworkClass({ core: this, signInMessage: this.signInMessage });
  };

  stopNetworkInterface = async () => {
    await this.networkInterface?.stop();
  };

  getProfile = async (address) => {
    if (!address) throw new Error("profile request for undefined address");
    if (!this._profiles[address]) {
      const profile = (this._profiles[address] = {
        description: null,
        website: null,
        image: null,
        ENS: null,
        address,
      });

      if (!address) {
        return profile;
      }

      profile.name = `${address.substr(0, 6)}…${address.substr(-6)}`;

      if (!profile.image) {
        profile.image = createIcon({ seed: address }).toDataURL();
        const profileWithIcon = {
          ...profile,
          image: createIcon({ seed: address }).toDataURL(),
        };
        this._profiles[address] = profileWithIcon;
      }
      if (!profile.ENS) {
        profile.ENS = this._fetchENSName(address);
      }
    }
    return this._profiles[address];
  };

  _fetchENSName = async (address) => {
    let ENS = {};
    try {
      await getENSName(address).then((res) => (ENS.name = res));
      if (ENS.name) return ENS;
      return {};
    } catch (err) {
      console.log(`ENS error: ${err}`);
    }
  };

  _socketOpen = () => {
    this.__pingServerTimeout = setInterval(this.ping, 5000);
    this.lastSocketOpenState = true;
    this.emit("open");
  };

  _socketClose = ({ noRetry }) => {
    clearInterval(this.__pingServerTimeout);
    this.emit("close");
    if (!noRetry) {
      // toast.error("Connection to server closed. Please try again in a minute");
      // console.log("test socket close", noRetry);
      setTimeout(
        () => {
          this.lastSocketOpenState = false;
          this.start();
        },
        this.lastSocketOpenState ? 0 : 8000
      );
    }
  };

  _socketMsg = (e) => {
    if (!e.data && e.data.length <= 0) return;
    const msg = JSON.parse(e.data);
    this.emit("message", msg.op + "_ws", msg.data);
  };

  start = () => {
    if (this.ws) this.stop();
    this.ws = new WebSocket(this.websocketUrl);
    this.ws.addEventListener("open", this._socketOpen);
    this.ws.addEventListener("close", this._socketClose);
    this.ws.addEventListener("message", this._socketMsg);
    this.emit("start");
  };

  stop = () => {
    if (!this.ws) return;
    this.ws.removeEventListener("open", this._socketOpen);
    this.ws.removeEventListener("close", this._socketClose);
    this.ws.removeEventListener("message", this._socketMsg);
    this._socketClose({ noRetry: true });
    this.ws.close();
    this.ws = null;
    this.emit("stop");
  };

  getAccountState = async () => {
    return (await this.networkInterface?.getAccountState()) ?? {};
  };

  ping = () => this.send("ping");

  send = (op, args) => {
    return this.ws.send(JSON.stringify({ op, args }));
  };

  sendRequest = async (url, method, data, isPrivate = false) => {
    if (method) method = method.toLowerCase();
    let token;
    if (isPrivate) {
      token = sessionStorage.getItem("access_token");
      if (!token) return;
    }
    console.log(url, method, data);

    const fullUrl = this.apiUrl + "/" + url;
    const hasBody = ["post", "put"].includes(method);
    const finalData = hasBody ? data || {} : undefined;
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      params: !hasBody && data,
    };
    await axios[method || "get"](
      fullUrl,
      hasBody ? finalData : config,
      hasBody && config
    )
      .then((res) =>
        this.emit("message", url.replaceAll("/", "_") + "_" + method, res.data)
      )
      .catch((error) => {
        // TODO
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(
            "API Error",
            error.response.status,
            (error.response.data.error && error.response.data.message) ||
              error.message
          );
          toast.error(
            `API Error ${error.response.status}: ${
              (error.response.data.error && error.response.data.message) || error.message
            }`
          );
          // console.log("status", error.response.status);
          // console.log("headers", error.response.headers);
          // console.log("request", error.request);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log("request", error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("api error", error.message);
        }
        // console.log(error.config);
      });
  };

  subscribeToMarket = (market) => {
    this.sendRequest("markets/subscription", "POST", {
      network: this.network,
      market: market,
      uuid: this.ws.uuid,
      clear: true,
    });
  };

  unsubscribeToMarket = (market) => {
    this.sendRequest("markets/subscription", "DELETE", {
      network: this.network,
      market: market,
      uuid: this.ws.uuid,
    });
  };

  getMarketConfig = (market) => {
    this.sendRequest("markets/config", "GET", {
      network: this.network,
      markets: market,
    });
  };

  getMarketInfo = (market) => {
    this.sendRequest("markets/info", "GET", {
      network: this.network,
      markets: market,
    });
  };

  cancelOrder = (orderId) => {
    this.sendRequest(
      "user/order",
      "DELETE",
      {
        id: orderId,
      },
      true
    );
  };

  cancelAllOrders = async () => {
    this.sendRequest(
      "user/orders",
      "DELETE",
      {
        market: undefined,
        side: undefined,
      },
      true
    );
    return true;
  };

  getOrderBook(market, side) {
    this.sendRequest("orders", "GET", {
      network: this.network,
      market,
      side: undefined,
      page: undefined,
      per_page: undefined,
    });
  }

  submitOrder = async (
    product,
    side,
    price,
    amount,
    feeType,
    fee,
    orderType
  ) => {
    if (!this.isSignedIn()) return;

    const data = await this.networkInterface.prepareOrder(
      product,
      side,
      price,
      amount,
      feeType,
      fee,
      orderType
    );

    this.sendRequest(
      "user/order",
      "POST",
      {
        tx: data.tx,
        market: data.market,
        amount: data.amount,
        price: data.price,
        type: orderType,
      },
      true
    );
  };

  getNetworks = () => {
    this.axiosInstance.get("/networks").then((res) => {
      this.emit("setNetworkList", res.data.networks);
    });
  };

  verifiedAccountNonce = async () => {
    return await this._accountState.verified.nonce;
  };

  increaseWalletNonce = async () => {
    let increaseNonceResult = {};

    const increaseNonceRes = await this.networkInterface.increaseWalletNonce();
    // cancel all orders if wallet nonce is increased
    this.cancelAllOrders();
    const verifiedAccountNonce = await this._accountState.verified.nonce;
    if (increaseNonceRes) {
      increaseNonceResult.response = increaseNonceRes;
      increaseNonceResult.verifiedAccountNonce = verifiedAccountNonce;
    }

    return increaseNonceResult;
  };

  depositL2 = async (amount, token) => {
    return this.networkInterface?.depositL2(amount, token);
  };

  withdrawL2 = async (amount, token) => {
    return this.networkInterface?.withdrawL2(amount, token);
  };

  depositL2Fee = async (token) => {
    return this.networkInterface?.depositL2Fee(token);
  };

  withdrawL2Fee = async (token) => {
    return this.networkInterface?.withdrawL2Fee(token);
  };

  getCommitedBalance = async () => {
    const commitedBalance = this.networkInterface?.getCommitedBalance();
    if (commitedBalance) {
      return commitedBalance;
    } else {
      return 0;
    }
  };

  getNetworkContract = () => {
    return this.networkInterface?.BRIDGE_CONTRACT;
  };

  approveSpendOfCurrency = async (currency, allowance = maxAllowance) => {
    return await this.networkInterface?.approveSpendOfCurrency(
      currency,
      allowance || maxAllowance,
      erc20ContractABI
    );
  };

  getBalanceOfCurrency = async (currency) => {
    return await this.networkInterface?.getBalanceOfCurrency(
      currency,
      erc20ContractABI,
      maxAllowance
    );
  };

  getWalletBalances = async () => {
    if (!this.networkInterface || !this.networkInterface.apiProvider)
      return null;
    const balances = {};

    const getBalance = async (ticker) => {
      try {
        const { balance, allowance } = await this.getBalanceOfCurrency(ticker);
        balances[ticker] = {
          value: balance,
          allowance,
          valueReadable: formatAmount(balance, this.currencies[ticker]),
        };

        this.emit("balanceUpdate", "wallet", { ...balances });
      } catch (err) {
        console.error(err);
      }
    };
    let tickers;
    try {
      tickers = Object.keys(this.currencies).filter(
        (ticker) => this.currencies[ticker].chain[this.network]
      );
    } catch (err) {
      return null;
    }

    await Promise.all(tickers.map((ticker) => getBalance(ticker)));

    return balances;
  };

  getBalances = async () => {
    if (!this.networkInterface) return null;
    const balances = await this.networkInterface.getBalances();
    this.emit("balanceUpdate", this.network, balances);
    return balances;
  };

  getOrderDetailsWithoutFee = (order) => {
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
  };

  getFillDetailsWithoutFee(fill) {
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
    const finalTime = this.hasOneDayPassed(time);
    return {
      price: price,
      quoteQuantity: quoteQuantity,
      baseQuantity: baseQuantity,
      time: finalTime,
    };
  }

  hasOneDayPassed(time) {
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

  getCurrencyLogo(currency) {
    try {
      return require(`assets/images/currency/${currency}.svg`);
    } catch (e) {
      return require(`assets/images/currency/ZZ.webp`);
    }
  }

  isSignedIn = () => {
    return sessionStorage.getItem("access_token") !== null;
  };
}
