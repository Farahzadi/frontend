import Emitter from "tiny-emitter";
import axios from "axios";
import { toast } from "react-toastify";
import { getAppConfig } from ".";

const DEFAULT_NETWORK = process.env.REACT_APP_DEFAULT_NETWORK;

export default class Core extends Emitter {
  static instance = null;
  static init(config) {
    this.instance = new Core(config);
  }

  static Actions = [
    "start",
    "stop",
    "setNetwork",
    "subscribeToMarket",
    "unsubscribeToMarket",
    "getMarketConfig",
    "getMarketInfo",
    "cancelOrder",
    "cancelAllOrders",
    "getOrderBook",
    "validateOrder",
    "submitOrder",
    "getNetworks",
    "emit",
    "on",
    "off",
  ];

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
    signInMessage,
  }) {
    super();

    this.networkClasses = networkClasses;
    this.networkInterface = null;
    this.network = null;

    this.infuraId = infuraId;
    this.websocketUrl = websocketUrl;
    this.apiUrl = apiUrl;
    this.axiosInstance = axios.create({
      baseURL: apiUrl,
      timeout: 3000,
    });
    this.signInMessage = signInMessage ?? "Login to Dexpresso";
  }

  setStore(store) {
    this.store = store;
  }

  async setNetwork(network) {
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
  }

  async connectWallet() {
    if (this.network) await this.networkInterface?.connectWallet();
  }

  async disconnectWallet() {
    await this.networkInterface?.disconnectWallet();
  }

  onProviderStateChange(state) {
    this.emit("providerStateChange", state);
  }

  initiateNetworkInteface(network) {
    const NetworkClass = this.networkClasses[network];
    if (!NetworkClass) throw new Error("Network not found");
    return new NetworkClass({ core: this, signInMessage: this.signInMessage });
  }

  async stopNetworkInterface() {
    await this.networkInterface?.stop();
  }

  _socketOpen() {
    this.lastSocketOpenState = true;
    this.emit("open");
  }

  _socketClose(options) {
    const { noRetry } = options ?? {};
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
  }

  async _socketMsg(e) {
    if (!e.data && e.data.length <= 0) return;
    const msg = JSON.parse(e.data);
    const path = msg.op + "_ws";
    const payload = msg.data;
    const result = await this.apiHandlers[path]?.(payload);
    this.emit("message", path, { data: payload, handlerResult: result });
  }

  start() {
    if (this.ws) this.stop();
    this.ws = new WebSocket(this.websocketUrl);
    this.ws.uuidPromise = new Promise((res, rej) => {
      this.ws.uuidPromiseResolve = () => {
        this.ws.uuidPromiseResolve = undefined;
        res();
      };
    });
    this.ws.addEventListener("open", () => this._socketOpen());
    this.ws.addEventListener("close", () => this._socketClose());
    this.ws.addEventListener("message", (e) => this._socketMsg(e));
    this.emit("start");
  }

  stop() {
    if (!this.ws) return;
    this.ws.removeEventListener("open", () => this._socketOpen());
    this.ws.removeEventListener("close", () => this._socketClose());
    this.ws.removeEventListener("message", () => this._socketMsg());
    this._socketClose({ noRetry: true });
    this.ws.close();
    this.ws = null;
    this.emit("stop");
  }

  send(op, args) {
    return this.ws.send(JSON.stringify({ op, args }));
  }

  async sendRequest(url, method, data, isPrivate = false) {
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
      .then(async (res) => {
        const path = url.replaceAll("/", "_") + "_" + method;
        const payload = res.data;
        const result = await this.apiHandlers[path]?.(payload);
        this.emit("message", path, { data: payload, handlerResult: result });
      })
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
  }

  subscribeToMarket(market) {
    this.sendRequest("markets/subscription", "POST", {
      network: this.network,
      market: market,
      uuid: this.ws.uuid,
      clear: true,
    });
  }

  unsubscribeToMarket(market) {
    this.sendRequest("markets/subscription", "DELETE", {
      network: this.network,
      market: market,
      uuid: this.ws.uuid,
    });
  }

  getMarketConfig(market) {
    this.sendRequest("markets/config", "GET", {
      network: this.network,
      markets: market,
    });
  }

  getMarketInfo(market) {
    this.sendRequest("markets/info", "GET", {
      network: this.network,
      markets: market,
    });
  }

  cancelOrder(orderId) {
    this.sendRequest(
      "user/order",
      "DELETE",
      {
        id: orderId,
      },
      true
    );
  }

  cancelAllOrders() {
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
  }

  getOrderBook(market, side) {
    this.sendRequest("orders", "GET", {
      network: this.network,
      market,
      side: undefined,
      page: undefined,
      per_page: undefined,
    });
  }

  async validateOrder({ market, amount, price, side, fee, type }) {
    const data = await this.networkInterface?.validateOrder({
      market,
      amount,
      price,
      side,
      fee,
      type,
    });
    return data;
  }

  async submitOrder(data) {
    if (!this.isSignedIn()) return;

    const order = await this.networkInterface.prepareOrder(data);

    this.sendRequest(
      "user/order",
      "POST",
      {
        tx: order,
        market: data.market,
        amount: data.amount,
        price: data.price,
        type: data.type,
      },
      true
    );
  }

  getNetworks() {
    this.axiosInstance.get("/networks").then((res) => {
      this.emit("setNetworkList", res.data.networks);
    });
  }

  getCurrencyLogo(currency) {
    try {
      return require(`assets/images/currency/${currency}.svg`);
    } catch (e) {
      return require(`assets/images/currency/ZZ.webp`);
    }
  }

  isSignedIn() {
    return sessionStorage.getItem("access_token") !== null;
  }

  apiHandlers = {
    connected_ws: (payload) => {
      this.ws.uuid = payload.uuid;
      this.ws.uuidPromiseResolve?.();
    },
    login_post: (payload) => {
      sessionStorage.setItem("access_token", payload.access_token);
    },
  };

  async run(action, ...args) {
    if (Core.Actions.includes(action)) return await this[action](...args);
    if (this.networkInterface?.constructor.Actions?.includes(action))
      return await this.networkInterface[action](...args);
  }

  static async run(action, ...args) {
    if (!this.instance) this.init(getAppConfig()); // throw new Error("running when instance is not initialised");
    return await this.instance.run(action, ...args);
  }

  static getInstance() {
    return this.instance;
  }
}
