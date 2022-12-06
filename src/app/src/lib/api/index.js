import Core from "./Core";
import ZKSyncInterface from "./networks/ZKSyncInterface";
import ZKSyncGoerliInterface from "./networks/ZKSyncGoerliInterface";
import EthereumInterface from "./networks/EthereumInterface";
import EthereumGoerliInterface from "./networks/EthereumGoerliInterface";

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
  currencies: {
    ETH: {
      image: require("assets/images/currency/ETH.svg"),
      name: "Ethereum",
      decimals: 18,
      chain: {
        zksyncv1: {
          tokenId: 0,
          contract: "0x0000000000000000000000000000000000000000",
        },
        zksyncv1_goerli: {
          tokenId: 0,
          contract: "0x0000000000000000000000000000000000000000",
        },
        ethereum: {
          contract: "0x0000000000000000000000000000000000000000",
        },
        ethereum_goerli: {
          contract: "0x0000000000000000000000000000000000000000",
        },
      },
      gasFee: 0.0003,
    },
    USDC: {
      image: require("assets/images/currency/USDC.svg"),
      name: "USDC",
      decimals: 6,
      chain: {
        zksyncv1: {
          tokenId: 2,
          contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        },
        zksyncv1_goerli: {
          tokenId: 3,
          contract: "0xd35CCeEAD182dcee0F148EbaC9447DA2c4D449c4",
        },
        ethereum: {
          contract: "0x0000000000000000000000000000000000000000",
        },
        ethereum_goerli: {
          contract: "0x0000000000000000000000000000000000000000",
        },
      },
      gasFee: 1,
    },
    USDT: {
      image: require("assets/images/currency/USDT.svg"),
      name: "USDT",
      decimals: 6,
      chain: {
        zksyncv1: {
          tokenId: 4,
          contract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        },
        ethereum: {
          contract: "0x0000000000000000000000000000000000000000",
        },
        ethereum_goerli: {
          contract: "0x0000000000000000000000000000000000000000",
        },
      },
      gasFee: 1,
    },
    DAI: {
      image: require("assets/images/currency/DAI.svg"),
      name: "DAI",
      decimals: 18,
      chain: {
        zksyncv1: {
          tokenId: 1,
          contract: "0x6b175474e89094c44da98b954eedeac495271d0f",
        },
        zksyncv1_goerli: {
          tokenId: 4,
          contract: "0x5C221E77624690fff6dd741493D735a17716c26B",
        },
        ethereum: {
          contract: "0x0000000000000000000000000000000000000000",
        },
        ethereum_goerli: {
          contract: "0x0000000000000000000000000000000000000000",
        },
      },
      gasFee: 1,
    },
    WBTC: {
      image: require("assets/images/currency/WBTC.svg"),
      name: "Bitcoin",
      decimals: 8,
      chain: {
        zksyncv1: {
          tokenId: 15,
          contract: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        },
        ethereum: {
          contract: "0x0000000000000000000000000000000000000000",
        },
        ethereum_goerli: {
          contract: "0x0000000000000000000000000000000000000000",
        },
      },
      gasFee: 0.00003,
    },
    FXS: {
      image: require("assets/images/currency/WBTC.svg"),
      name: "Frax Shares",
      decimals: 18,
      chain: {
        zksyncv1: {
          tokenId: 120,
          contract: "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0",
        },
        ethereum: {
          contract: "0x0000000000000000000000000000000000000000",
        },
        ethereum_goerli: {
          contract: "0x0000000000000000000000000000000000000000",
        },
      },
      gasFee: 0.1,
    },
    FRAX: {
      image: require("assets/images/currency/WBTC.svg"),
      name: "Frax",
      decimals: 18,
      chain: {
        zksyncv1: {
          tokenId: 92,
          contract: "0x853d955acef822db058eb8505911ed77f175b99e",
        },
        ethereum: {
          contract: "0x0000000000000000000000000000000000000000",
        },
        ethereum_goerli: {
          contract: "0x0000000000000000000000000000000000000000",
        },
      },
      gasFee: 1,
    },
    WETH: {
      image: require("assets/images/currency/ETH.svg"),
      name: "Wrapped Ether",
      decimals: 18,
      chain: {
        zksyncv1: {
          tokenId: 61,
          contract: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        },
        ethereum: {
          contract: "0x0000000000000000000000000000000000000000",
        },
        ethereum_goerli: {
          contract: "0x0000000000000000000000000000000000000000",
        },
      },
      gasFee: 0.0003,
    },
  },
  validMarkets: {
    zksyncv1: [
      "ETH-USDT",
      "ETH-USDC",
      "ETH-DAI",
      "ETH-WBTC",
      "USDC-USDT",
      "WBTC-USDT",
      "WBTC-USDC",
      "WBTC-DAI",
      "DAI-USDT",
      "DAI-USDC",
      "WETH-ETH",
      "FXS-FRAX",
      "ETH-FRAX",
    ],
    zksyncv1_goerli: ["ETH-USDC", "ETH-DAI", "DAI-USDC"],
    ethereum: ["ETH-USDC", "ETH-DAI", "DAI-USDC"],
    ethereum_goerli: ["ETH-USDC", "ETH-DAI", "DAI-USDC"],
  },
});

if (NODE_ENV !== "production" && typeof window !== "undefined") {
  window.api = api;
}

export { Core };
export default api;
