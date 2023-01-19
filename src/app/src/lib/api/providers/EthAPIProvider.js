import { ethers } from "ethers";
import { toast } from "react-toastify";
import WalletConnectProvider from "@walletconnect/web3-provider";
import MetaMaskOnboarding from "@metamask/onboarding";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";

import Web3Modal, { providers } from "web3modal";
import APIProvider from "./APIProvider";
import erc20ContractABI from "lib/contracts/ERC20.json";

export default class EthAPIProvider extends APIProvider {

  async start(emitChanges = true) {
    let onboarding = new MetaMaskOnboarding();
    if (emitChanges) this.state.set(APIProvider.State.CONNECTING);
    const providerOptions = {
      injected: {
        display: {
          name: "MetaMask",
          description: "Connect to your MetaMask Wallet",
        },
        package: null,
      },
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: "7c22b75cd9cc4f7fa0b03ac9484693aa",
        },
      },
      binancechainwallet: {
        package: true,
      },
      coinbasewallet: {
        package: CoinbaseWalletSDK,
        options: {
          appName: "Coinbase",
          infuraId: "7c22b75cd9cc4f7fa0b03ac9484693aa",
        },
      },
      "custom-coinbase": {
        display: {
          logo: "images/coinbase.svg",
          name: "Coinbase",
          description: "Scan with WalletLink to connect",
        },
        options: {
          appName: "app", // Your app name
          infuraId: "7c22b75cd9cc4f7fa0b03ac9484693aa",
        },
        package: WalletLink,
        connector: async (_, options) => {
          const { appName, networkUrl, chainId } = options;
          const walletLink = new CoinbaseWalletSDK({
            appName,
          });
          const provider = walletLink.makeWeb3Provider(networkUrl, chainId);
          await provider.enable();
          return provider;
        },
      },
    };

    if (!window.ethereum) {
      providerOptions["custom-metamask"] = {
        display: {
          logo: providers.METAMASK.logo,
          name: "Install MetaMask",
          description: "Connect using browser wallet",
        },
        package: {},
        connector: async () => {
          if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
            onboarding.startOnboarding();
            onboarding._injectForwarder("INJECT");
          }
        },
      };
    }

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

    if (provider.isMetaMask) onboarding.stopOnboarding();

    const networkChanged = await this.switchNetwork();

    if (networkChanged) return await this.start();

    const signer = this.provider.getSigner();

    // const address = await signer.getAddress();

    // const network = await this.provider.getNetwork();

    this.wallet = signer;

    if (emitChanges) this.state.set(APIProvider.State.CONNECTED);
  }

  async stop(emitChanges = true) {
    if (this.web3Modal) this.web3Modal.clearCachedProvider();
    delete this.provider;
    delete this.wallet;
    if (emitChanges) this.state.set(APIProvider.State.DISCONNECTED);
  }

  async getAddress() {
    const address = await this.wallet?.getAddress();
    return ethers.utils.getAddress(address);
  }

  async switchNetwork() {
    const chainId = ethers.utils.hexStripZeros(this.networkInterface.CHAIN_ID ?? 0);
    try {
      const currentChainId = ethers.utils.hexStripZeros((await this.provider.getNetwork())?.chainId ?? 0);
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
    if (!userAddress) userAddress = await this.getAddress();
    const token = new ethers.Contract(tokenAddress, erc20ContractABI, this.provider);
    const allowance = await token.allowance(userAddress, spenderAddress);
    return allowance;
  }

  async approve(tokenAddress, spenderAddress, amount) {
    amount = ethers.BigNumber.from(amount);
    const contract = new ethers.Contract(tokenAddress, erc20ContractABI, this.wallet);
    const tx = await contract.approve(spenderAddress, amount);
    await tx.wait();
  }

  async getBalance(userAddress) {
    if (!userAddress) userAddress = await this.getAddress();
    const ethBalance = await this.provider.getBalance(userAddress);
    return ethBalance;
  }

  async getTokenBalance(tokenAddress, userAddress) {
    if (!userAddress) userAddress = await this.getAddress();
    const token = new ethers.Contract(tokenAddress, erc20ContractABI, this.provider);
    const balance = await token.balanceOf(userAddress);
    return balance;
  }

  async getNonce() {
    return await this.wallet.getTransactionCount();
  }

  async signOrder({ orderHash }) {
    const result = await this.wallet.signMessage(ethers.utils.arrayify(orderHash));
    return result;
  }

  onAccountChange = cb => {
    if (this.state.get() === APIProvider.State.CONNECTED) this.provider.provider.on("accountsChanged", cb);
  };

}
