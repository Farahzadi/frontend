import get from "lodash/get";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import APIProvider from "./APIProvider";
import axios from "axios";
import Web3Modal from "web3modal";

export default class EthAPIProvider extends APIProvider {
  static validSides = ["b", "s"];
  static ETH_CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

  async start(emitChanges = true) {
    if (emitChanges) this.state.set(APIProvider.State.CONNECTING);

    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
      },
    };

    if (typeof window === "undefined") {
      toast.error("Browser doesn't support Web3.");
      return;
    }

    this.web3Modal = new Web3Modal({
      network: this.NETWORK_NAME,
      cacheProvider: true,
      providerOptions,
      theme: "dark",
    });

    const provider = await this.web3Modal.connect();

    this.provider = new ethers.providers.Web3Provider(provider);

    const networkChanged = await this.switchNetwork();

    if (networkChanged) return await this.start();

    const signer = this.provider.getSigner();

    // const address = await signer.getAddress();

    // const network = await this.provider.getNetwork();

    this.wallet = signer;

    if (emitChanges) this.state.set(APIProvider.State.CONNECTED);
    return result;
  }

  async getAddress() {
    const address = await this.wallet?.getAddress();
    return ethers.utils.getAddress(address);
  }

  async switchNetwork() {
    const chainId = this.networkToChainId(this.NETWORK);
    if (!chainId) return false;
    try {
      const currentChainId = ethers.utils.hexStripZeros(
        (await this.provider.getNetwork())?.chainId ?? 0
      );
      if (currentChainId === chainId) return false;

      await this.provider.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (err) {
      console.error("Error on switching network!", err);
      return false;
    }
    return true;
  }

  getProfile = async (address) => {
    if (address) {
      try {
        const { data } = await axios
          .get(`https://ipfs.3box.io/profile?address=${address}`)
          .catch((err) => {
            if (err.response.status === 404) {
              throw err;
            }
          });

        if (data) {
          const profile = {
            coverPhoto: get(data, "coverPhoto.0.contentUrl./"),
            image: get(data, "image.0.contentUrl./"),
            description: data.description,
            emoji: data.emoji,
            website: data.website,
            location: data.location,
            twitter_proof: data.twitter_proof,
          };

          if (data.name) {
            profile.name = data.name;
          }
          if (profile.image) {
            profile.image = `https://gateway.ipfs.io/ipfs/${profile.image}`;
          }

          return profile;
        }
      } catch (err) {
        if (!err.response) {
          throw err;
        }
      }
    } else {
      return;
    }
  };

  async signMessage(message) {
    const address = await this.getAddress();
    try {
      const signature = await this.provider.provider.request({
        method: "personal_sign",
        params: [message, address],
      });
      return signature;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async verifyMessage(message, signature) {
    const address = await this.getAddress();
    try {
      const signedAddress = ethers.utils.verifyMessage(message, signature);
      return signedAddress === address;
    } catch (err) {
      console.error("Error on verifying signature:", err);
      return false;
    }
  }

  async getTransactionState(txHash) {
    const tx = await this.provider.getTransaction(txHash);
    return tx;
  }

  async getAllowance(userAddress, spenderAddress, tokenAddress) {
    const ERC20_ABI = [
      "function allowance(address owner, address spender) view returns (uint256)",
    ];
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const allowance = await token.allowance(userAddress, spenderAddress);
    return allowance;
  }

  async getBalance(userAddress) {
    if (!userAddress) userAddress = await this.getAddress();
    const ethBalance = await this.provider.getBalance(userAddress);
    return ethBalance;
  }

  async getTokenBalance(tokenAddress, userAddress) {
    if (!userAddress) userAddress = await this.getAddress();
    const ERC20_ABI = [
      "function balanceOf(address account) view returns (uint256)",
    ];
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const balance = await token.balanceOf(userAddress);
    return balance;
  }

  async signOrder(
    market,
    side,
    price,
    chainId,
    amount,
    sellTokenAddress,
    buyTokenAddress,
    fee,
    orderType
  ) {
    amount = Number(amount);
    price = Number(price).toPrecision(8);
    price = ethers.utils.parseUnits(price, 18);
    fee = ethers.utils.parseUnits(fee, 18);

    const currencies = market.split("-");
    const nowUnix = (Date.now() / 1000) | 0;
    const validUntil = nowUnix + 24 * 3600;

    if (currencies[0] === "USDC" || currencies[0] === "USDT") {
      amount = Number(amount).toFixed(7).slice(0, -1);
    }

    if (!EthAPIProvider.validSides.includes(side)) {
      throw new Error("Invalid side");
    }

    if (side === "s") {
      const allowance = await this.getAllowance(
        this.wallet,
        EthAPIProvider.ETH_CONTRACT_ADDRESS,
        sellTokenAddress
      );
      if (allowance < amount) {
        throw new Error("Insufficient allowance");
      }
    }

    if (side === "b") {
      const allowance = await this.getAllowance(
        this.wallet,
        EthAPIProvider.ETH_CONTRACT_ADDRESS,
        buyTokenAddress
      );
      if (allowance < amount) {
        throw new Error("Insufficient allowance");
      }
    }

    const order = {
      validUntil,
      price,
      sellTokenAddress,
      buyTokenAddress,
      chainId,
      fee,
    };
    const orderHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "address", "address", "uint256", "uint256"],
      [
        order.validUntil,
        order.price,
        order.sellTokenAddress,
        order.buyTokenAddress,
        order.chainId,
        order.fee,
      ]
    );

    const signature = await this.wallet.signMessage(
      ethers.utils.arrayify(orderHash)
    );
    const signedOrder = {
      ...order,
      signature,
    };

    return {
      tx: signedOrder,
      market,
      amount,
      price,
      side,
      type: orderType,
    };
  }

  getChainName = (chainId) => {
    if (Number(chainId) === "ethereum") {
      return "mainnet";
    } else if (Number(chainId) === "ethereum_goerli") {
      return "goerli";
    } else {
      throw Error("Chain ID not understood");
    }
  };

  networkToChainId = (network) => {
    const map = {
      zksyncv1: "0x1",
      ethereum: "0x1",
      zksyncv1_goerli: "0x5",
      ethereum_goerli: "0x5",
    };
    return map[network];
  };
}
