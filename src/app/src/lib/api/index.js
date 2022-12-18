import Core from "./Core";
import ZKSyncInterface from "./networks/ZKSyncInterface";
import ZKSyncGoerliInterface from "./networks/ZKSyncGoerliInterface";
import EthereumInterface from "./networks/EthereumInterface";
import EthereumGoerliInterface from "./networks/EthereumGoerliInterface";
import store from "lib/store";
import { initActions } from "./init";

const NODE_ENV = process.env.NODE_ENV;
const INFURA_ID = process.env.REACT_APP_INFURA_ID;
const WEBSOCKET_URL = process.env.REACT_APP_BACKEND_WS;
const API_URL = process.env.REACT_APP_BACKEND_API;
const SIGN_IN_MESSAGE = process.env.REACT_APP_SIGN_IN_MESSAGE;

if (!INFURA_ID) throw new Error("couldn't find Infura id");
if (!WEBSOCKET_URL) throw new Error("couldn't find Websocket Url");
if (!API_URL) throw new Error("couldn't find Backend API Url");

const api = new Core({
  infuraId: INFURA_ID,
  websocketUrl: WEBSOCKET_URL,
  apiUrl: API_URL,
  signInMessage: SIGN_IN_MESSAGE,
  networkClasses: {
    zksyncv1: ZKSyncInterface,
    zksyncv1_goerli: ZKSyncGoerliInterface,
    ethereum: EthereumInterface,
    ethereum_goerli: EthereumGoerliInterface,
  },
});

if (NODE_ENV !== "production" && typeof window !== "undefined") {
  window.api = api;
}

initActions(api, store);

export { Core };
export default api;
