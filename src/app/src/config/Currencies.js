const Currencies = {
  ETH: {
    image: require("assets/images/currency/ETH.svg"),
    name: "Ethereum",
    decimals: 18,
    chain: {
      zksyncv1: {
        contract: "0x0000000000000000000000000000000000000000",
        L2Contract: 0,
      },
      zksyncv1_goerli: {
        contract: "0x0000000000000000000000000000000000000000",
        L2Contract: 0,
      },
      ethereum: {
        contract: "0x0000000000000000000000000000000000000000",
      },
      ethereum_goerli: {
        contract: "0x0000000000000000000000000000000000000000",
      },
    },
  },
  USDC: {
    image: require("assets/images/currency/USDC.svg"),
    name: "USDC",
    decimals: 6,
    chain: {
      zksyncv1: {
        contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        L2Contract: 2,
      },
      zksyncv1_goerli: {
        contract: "0xd35CCeEAD182dcee0F148EbaC9447DA2c4D449c4",
        L2Contract: 3,
      },
      ethereum: {
        contract: "0x0000000000000000000000000000000000000000",
      },
      ethereum_goerli: {
        contract: "0x0000000000000000000000000000000000000000",
      },
    },
  },
  USDT: {
    image: require("assets/images/currency/USDT.svg"),
    name: "USDT",
    decimals: 6,
    chain: {
      zksyncv1: {
        contract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        L2Contract: 4,
      },
      ethereum: {
        contract: "0x0000000000000000000000000000000000000000",
      },
      ethereum_goerli: {
        contract: "0x0000000000000000000000000000000000000000",
      },
    },
  },
  DAI: {
    image: require("assets/images/currency/DAI.svg"),
    name: "DAI",
    decimals: 18,
    chain: {
      zksyncv1: {
        contract: "0x6b175474e89094c44da98b954eedeac495271d0f",
        L2Contract: 1,
      },
      zksyncv1_goerli: {
        contract: "0x5C221E77624690fff6dd741493D735a17716c26B",
        L2Contract: 4,
      },
      ethereum: {
        contract: "0x0000000000000000000000000000000000000000",
      },
      ethereum_goerli: {
        contract: "0x0000000000000000000000000000000000000000",
      },
    },
  },
  WBTC: {
    image: require("assets/images/currency/WBTC.svg"),
    name: "Bitcoin",
    decimals: 8,
    chain: {
      zksyncv1: {
        contract: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        L2Contract: 15,
      },
      ethereum: {
        contract: "0x0000000000000000000000000000000000000000",
      },
      ethereum_goerli: {
        contract: "0x0000000000000000000000000000000000000000",
      },
    },
  },
  FXS: {
    image: require("assets/images/currency/WBTC.svg"),
    name: "Frax Shares",
    decimals: 18,
    chain: {
      zksyncv1: {
        contract: "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0",
        L2Contract: 120,
      },
      ethereum: {
        contract: "0x0000000000000000000000000000000000000000",
      },
      ethereum_goerli: {
        contract: "0x0000000000000000000000000000000000000000",
      },
    },
  },
  FRAX: {
    image: require("assets/images/currency/WBTC.svg"),
    name: "Frax",
    decimals: 18,
    chain: {
      zksyncv1: {
        contract: "0x853d955acef822db058eb8505911ed77f175b99e",
        L2Contract: 92,
      },
      ethereum: {
        contract: "0x0000000000000000000000000000000000000000",
      },
      ethereum_goerli: {
        contract: "0x0000000000000000000000000000000000000000",
      },
    },
  },
  WETH: {
    image: require("assets/images/currency/ETH.svg"),
    name: "Wrapped Ether",
    decimals: 18,
    chain: {
      zksyncv1: {
        contract: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        L2Contract: 61,
      },
      ethereum: {
        contract: "0x0000000000000000000000000000000000000000",
      },
      ethereum_goerli: {
        contract: "0x0000000000000000000000000000000000000000",
      },
    },
  },
};

export function getNetworkCurrencies(network) {
  const entries = Object.entries(Currencies)
    .filter(([_, currency]) => currency.chain[network])
    .map(([ticker, currency]) => {
      const { chain, ...curr } = currency;
      return [
        ticker,
        {
          ...curr,
          info: chain[network],
        },
      ];
    });
  return Object.fromEntries(entries);
}

export function getNetworkCurrency(network, ticker) {
  const { chain, ...curr } = Currencies[ticker];
  return { ...curr, info: chain?.[network] };
}

export default Currencies;
