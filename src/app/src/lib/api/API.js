import Web3 from "web3";
import { createIcon } from "@download/blockies";
import { toast } from "react-toastify";
import Web3Modal from "web3modal";
import Emitter from "tiny-emitter";
import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";

import { getENSName } from "lib/ens";
import { formatAmount } from "lib/utils";
import erc20ContractABI from "lib/contracts/ERC20.json";
import { maxAllowance } from "./constants";
import axios from "axios";

const chainMap = {
  "0x1": "zksyncv1",
  "0x5": "zksyncv1_goerli",
  // "0x1": "ethereum",
  // "0x5": "ethereum_goerli",
};

export default class API extends Emitter {
  networks = {};
  ws = null;
  apiProvider = null;
  ethersProvider = null;
  currencies = null;
  websocketUrl = null;
  _signInProgress = null;
  signedMessage = null;
  _profiles = {};
  _accountState = null;
  changingWallet = false;
  lastSocketOpenState = false;

  constructor({
    infuraId,
    websocketUrl,
    apiUrl,
    networks,
    currencies,
    validMarkets,
  }) {
    super();

    if (networks) {
      Object.entries(networks).forEach(([networkName, network]) => {
        this.networks[networkName] = {
          provider: new network.apiProvider(this, networkName),
          contract: network.contract,
        };
      });
    }

    this.infuraId = infuraId;
    this.websocketUrl = websocketUrl;
    this.apiUrl = apiUrl;
    this.currencies = currencies;
    this.validMarkets = validMarkets;

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", this.signOut);
      this.setAPIProvider(chainMap[window.ethereum.chainId] ?? "zksyncv1");
    } else {
      this.setAPIProvider("zksyncv1");
    }
  }

  getAPIProvider = (network) => {
    return this.networks[network]?.provider;
  };

  setAPIProvider = (network) => {

    if (!network) {
      this.signOut();
      return;
    }

    const apiProvider = this.getAPIProvider(network);
    console.log("apiProvider:", network, apiProvider);
    this.apiProvider = apiProvider;

    if (this.isZksyncChain()) {
      this.web3 = new Web3(
        window.ethereum ||
          new Web3.providers.HttpProvider(
            `https://${network}.infura.io/v3/${this.infuraId}`
          )
      );

      this.web3Modal = new Web3Modal({
        network: network,
        cacheProvider: true,
        theme: "dark",
        providerOptions: {
          walletconnect: {
            package: WalletConnectProvider,
            options: {
              infuraId: this.infuraId,
            },
          },
        },
      });
    }

    this.getAccountState().catch((err) => {
      console.log("Failed to switch providers", err);
    });

    this.emit("providerChange", network);
  };

  getProfile = async (address) => {
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
      toast.error("Connection to server closed. Please try again in a minute");
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
    const accountState = { ...(await this.apiProvider.getAccountState()) };
    accountState.profile = await this.getProfile(accountState.address);
    this.emit("accountState", accountState);
    return accountState;
  };

  ping = () => this.send("ping");

  send = (op, args) => {
    return this.ws.send(JSON.stringify({ op, args }));
  };

  sendRequest = (url, method, data, isPrivate = false) => {
    if (method) method = method.toLowerCase();
    let token;
    if (isPrivate) {
      token = sessionStorage.getItem("access_token");
      if (!token) return;
    }
    console.log(url, method, data, isPrivate);

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
    axios[method || "get"](
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

  refreshNetwork = async () => {
    if (!window.ethereum) return;
    let ethereumChainId;

    await this.signOut();

    switch (this.apiProvider.network) {
      case "zksyncv1":
        ethereumChainId = "0x1";
        break;
      case "zksyncv1_goerli":
        ethereumChainId = "0x5";
        break;
      default:
        return;
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ethereumChainId }],
    });
  };

  signIn = async (network, ...args) => {
    // console.log("login ATTEMPT");
    let accountState;
    let signature;
    const { uuid } = this.ws;
    if (!uuid) return;
    if (!this._signInProgress) {
      // console.log("starting login", uuid)
      this._signInProgress = Promise.resolve()
        .then(async () => {
          const apiProvider = this.apiProvider;

          if (network) {
            this.apiProvider = this.getAPIProvider(network);
          }

          await this.refreshNetwork();
          if (this.isZksyncChain()) {
            const web3Provider = await this.web3Modal.connect();
            this.web3.setProvider(web3Provider);
            this.ethersProvider = new ethers.providers.Web3Provider(
              web3Provider
            );
          }

          try {
            accountState = await apiProvider.signIn(...args);
          } catch (err) {
            await this.signOut();
            throw err;
          }

          if (
            this.changingWallet === true ||
            sessionStorage.getItem("login") === null
          ) {
            sessionStorage.clear("login");
            if (typeof window.ethereum !== "undefined") {
              await this.apiProvider
                .signMessage()
                .then((r) => (this.signedMessage = r));
            }
          }

          signature = sessionStorage.getItem("login");

          const api = this;
          if (accountState && accountState.id) {
            this.sendRequest("login", "POST", {
              chain_id: network,
              address: accountState.address,
              signature: signature,
              user_data: true,
              uuid,
            });
          }

          this.emit("signIn", accountState);
          this._accountState = accountState;

          return accountState;
        })
        .finally(() => {
          this._signInProgress = null;
          this.changingWallet = false;
        });
    }

    return this._signInProgress;
  };

  signOut = async () => {
    if (this._signInProgress) {
      return;
    } else if (!this.apiProvider) {
      return;
    } else if (this.web3Modal) {
      this.web3Modal.clearCachedProvider();
    }

    this.web3 = null;
    this.web3Modal = null;
    this.ethersProvider = null;
    this._accountState = null;
    this.changingWallet = true;
    this.setAPIProvider(this.apiProvider.network);
    this.emit("balanceUpdate", "wallet", {});
    this.emit("balanceUpdate", this.apiProvider.network, {});
    this.emit("accountState", {});
    this.emit("signOut");
  };

  getNetworkName = (network) => {
    const keys = Object.keys(this.networks);
    return keys[keys.findIndex((key) => network === this.networks[key][0])];
  };

  subscribeToMarket = (market) => {
    this.sendRequest("markets/subscription", "POST", {
      chain_id: this.apiProvider.network,
      market: market,
      uuid: this.ws.uuid,
      clear: true,
    });
  };

  unsubscribeToMarket = (market) => {
    this.sendRequest("markets/subscription", "DELETE", {
      chain_id: this.apiProvider.network,
      market: market,
      uuid: this.ws.uuid,
    });
  };

  getMarketConfig = (market) => {
    this.sendRequest("markets/config", "GET", {
      chain_id: this.apiProvider.network,
      markets: market,
    });
  };

  getMarketInfo = (market) => {
    this.sendRequest("markets/info", "GET", {
      chain_id: this.apiProvider.network,
      markets: market,
    });
  };

  isZksyncChain = () => {
    return !!this.apiProvider.zksyncCompatible;
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

  verifiedAccountNonce = async () => {
    return await this._accountState.verified.nonce;
  };

  increaseWalletNonce = async () => {
    let increaseNonceResult = {};

    const increaseNonceRes = await this.apiProvider.increaseWalletNonce();
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
    return this.apiProvider.depositL2(amount, token);
  };

  withdrawL2 = async (amount, token) => {
    return this.apiProvider.withdrawL2(amount, token);
  };

  depositL2Fee = async (token) => {
    return this.apiProvider.depositL2Fee(token);
  };

  withdrawL2Fee = async (token) => {
    return this.apiProvider.withdrawL2Fee(token);
  };

  getCommitedBalance = async () => {
    const commitedBalance = this.apiProvider.getCommitedBalance();
    if (commitedBalance) {
      return commitedBalance;
    } else {
      return 0;
    }
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

  isImplemented = (method) => {
    return this.apiProvider[method] && !this.apiProvider[method].notImplemented;
  };

  getNetworkContract = () => {
    return this.apiProvider.BRIDGE_CONTRACT;
  };

  approveSpendOfCurrency = async (currency) => {
    const netContract = this.getNetworkContract();
    if (netContract) {
      const [account] = await this.web3.eth.getAccounts();
      const { contractAddress } =
        this.currencies[currency].chain[this.apiProvider.network];
      const contract = new this.web3.eth.Contract(
        erc20ContractABI,
        contractAddress
      );
      await contract.methods
        .approve(netContract, maxAllowance)
        .send({ from: account });
    }
  };

  getBalanceOfCurrency = async (currency) => {
    const { contractAddress } =
      this.currencies[currency].chain[this.apiProvider.network];
    let result = { balance: 0, allowance: maxAllowance };
    if (!this.ethersProvider || !contractAddress) return result;

    try {
      const netContract = this.getNetworkContract();
      const [account] = await this.web3.eth.getAccounts();
      if (currency === "ETH") {
        result.balance = await this.web3.eth.getBalance(account);
        return result;
      }
      const contract = new this.web3.eth.Contract(
        erc20ContractABI,
        contractAddress
      );
      result.balance = await contract.methods.balanceOf(account).call();
      if (netContract) {
        result.allowance = ethers.BigNumber.from(
          await contract.methods.allowance(account, netContract).call()
        );
      }
      return result;
    } catch (e) {
      console.log(e);
      return result;
    }
  };

  getWalletBalances = async () => {
    const balances = {};

    const getBalance = async (ticker) => {
      const { balance, allowance } = await this.getBalanceOfCurrency(ticker);
      balances[ticker] = {
        value: balance,
        allowance,
        valueReadable: formatAmount(balance, this.currencies[ticker]),
      };

      this.emit("balanceUpdate", "wallet", { ...balances });
    };

    const tickers = Object.keys(this.currencies).filter(
      (ticker) => this.currencies[ticker].chain[this.apiProvider.network]
    );

    await Promise.all(tickers.map((ticker) => getBalance(ticker)));

    return balances;
  };

  getBalances = async () => {
    const balances = await this.apiProvider.getBalances();
    this.emit("balanceUpdate", this.apiProvider.network, balances);
    return balances;
  };

  getOrderDetailsWithoutFee = (order) => {
    const side = order.side;
    const baseQuantity = order.baseQuantity;
    const quoteQuantity = order.price * order.baseQuantity;
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
        priceWithoutFee = quoteQuantity / baseQuantity;
        quoteQuantityWithoutFee = quoteQuantity;
      } else {
        baseQuantityWithoutFee = baseQuantity - fee;
        if (orderStatus === "o" || orderStatus === "c" || orderStatus === "m") {
          remainingWithoutFee = baseQuantity - fee;
        } else {
          remainingWithoutFee = Math.max(0, remaining - fee);
        }
        priceWithoutFee = quoteQuantity / baseQuantityWithoutFee;
        quoteQuantityWithoutFee = priceWithoutFee * baseQuantityWithoutFee;
      }
    } else {
      if (orderType === "l") {
        baseQuantityWithoutFee = baseQuantity;
        quoteQuantityWithoutFee = quoteQuantity;
        priceWithoutFee = quoteQuantityWithoutFee / baseQuantity;
        remainingWithoutFee = Math.min(baseQuantity, remaining);
      } else {
        quoteQuantityWithoutFee = quoteQuantity - fee;
        priceWithoutFee = quoteQuantityWithoutFee / baseQuantity;
        baseQuantityWithoutFee = quoteQuantityWithoutFee / priceWithoutFee;
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
    const price = parseFloat(fill.price);
    let baseQuantity = fill.amount;
    let quoteQuantity = fill.price * fill.amount;
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

  getOrderBook(market, side) {
    this.sendRequest("orders", "GET", {
      chain_id: this.apiProvider.network,
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
    await this.apiProvider.submitOrder(
      product,
      side,
      price,
      amount,
      feeType,
      fee,
      orderType
    );
  };

  submitSwap = async (product, side, price, amount) => {
    await this.apiProvider.submitSwap(product, side, price, amount);
  };
}
