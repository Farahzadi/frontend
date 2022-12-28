class NetworkManager {
  networks = {
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
      "FXS-FRAX",
      "ETH-FRAX",
    ],
    zksyncv1_goerli: ["ETH-USDC", "ETH-DAI", "DAI-USDC"],
    ethereum: ["WETH-USDC", "WETH-DAI", "DAI-USDC"],
    ethereum_goerli: ["WETH-USDC", "WETH-DAI", "DAI-USDC", "ESP-CPC"],
  };

  set(data, expand = false) {
    this.networks = { ...(expand ? this.networks : {}), ...data };
  }

  get(network) {
    return this.networks[network];
  }

  has(network, market) {
    return Boolean(this.get(network)?.includes?.(market));
  }
}

const networkManager = new NetworkManager();

export default networkManager;
