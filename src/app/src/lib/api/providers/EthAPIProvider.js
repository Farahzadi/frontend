import get from "lodash/get";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import APIProvider from "./APIProvider";
import axios from "axios";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

export default class EthAPIProvider extends APIProvider {
  static ETH_CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

  async start(emitChanges = true) {
    if (emitChanges) this.state.set(APIProvider.State.CONNECTING);

    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
      },
      // "custom-walletlink": {
      //   display: {
      //     logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
      //     name: "Coinbase",
      //     description: "Connect to Coinbase Wallet (not Coinbase App)",
      //   },
      //   options: {
      //     appName: "Coinbase", // Your app name
      //     networkUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
      //     chainId: 1,
      //   },
      //   package: WalletLink,
      //   connector: async (_, options) => {
      //     const { appName, networkUrl, chainId } = options;
      //     const walletLink = new WalletLink({
      //       appName,
      //     });
      //     const provider = walletLink.makeWeb3Provider(networkUrl, chainId);
      //     await provider.enable();
      //     return provider;
      //   },
      // },
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
  }

  async stop(emitChanges = true) {
    // this.web3Modal.clearCachedProvider();
    delete this.provider;
    delete this.wallet;
    if (emitChanges) this.state.set(APIProvider.State.DISCONNECTED);
  }

  async getAddress() {
    const address = await this.wallet?.getAddress();
    return ethers.utils.getAddress(address);
  }

  async switchNetwork() {
    const chainId = ethers.utils.hexStripZeros(
      this.networkInterface.CHAIN_ID ?? 0
    );
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

  async getAllowance(tokenAddress, userAddress, spenderAddress) {
    const ERC20_ABI = [
      "function allowance(address owner, address spender) view returns (uint256)",
    ];
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const allowance = await token.allowance(userAddress, spenderAddress);
    return allowance;
  }

  async approve(tokenAddress, spenderAddress, amount) {
    amount = ethers.BigNumber.from(amount);
    const erc20ContractABI = "";
    const contract = new ethers.Contract(
      tokenAddress,
      erc20ContractABI,
      this.provider
    );
    await contract.approve(spenderAddress, amount);
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

  async signOrder({ orderHash }) {
    const result = await this.wallet.signMessage(
      ethers.utils.arrayify(orderHash)
    );
    return result;
  }
}
