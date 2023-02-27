import { ethers } from "ethers";
import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import walletLinkModule from "@web3-onboard/coinbase";
import Decimal from "decimal.js";

import APIProvider from "./APIProvider";
import erc20ContractABI from "lib/contracts/ERC20.json";
import WETHContractABI from "lib/contracts/WETH.json";

export default class EthAPIProvider extends APIProvider {

  async start(infuraId, emitChanges = true) {
    if (emitChanges) this.state.set(APIProvider.State.CONNECTING);
    const injected = injectedModule();
    const walletConnect = walletConnectModule();
    const walletLink = walletLinkModule();
    const GOERLI_RPC_URL = `https://goerli.infura.io/v3/${infuraId}`;
    const MAINNET_RPC_URL = `https://mainnet.infura.io/v3/${infuraId}`;
    const onboard = Onboard({
      wallets: [injected, walletLink, walletConnect],
      theme: "dark",
      connect: { showSidebar: false },
      chains: [
        {
          id: "0x1",
          token: "ETH",
          namespace: "evm",
          label: "Ethereum Mainnet",
          rpcUrl: MAINNET_RPC_URL,
        },
        {
          id: "0x5",
          token: "gETH",
          namespace: "evm",
          label: "Ethereum Goerli Testnet",
          rpcUrl: GOERLI_RPC_URL,
        },
      ],
    });

    if (typeof window === "undefined") {
      this.networkInterface.core.run("notify", "error", "Browser doesn't support Web3.", { save: true });
      return;
    }
    onboard.state.actions.updateAccountCenter({ enabled: false });
    this.onboard = onboard;

    const signer = await onboard.connectWallet();
    const { provider, chains } = signer[0];

    if (provider instanceof Error) throw provider.message;
    this.provider = new ethers.providers.Web3Provider(provider);

    this.chains = chains;

    const networkChanged = await this.switchNetwork();

    if (networkChanged) return await this.start();
    this.wallet = this.provider.getSigner();

    if (emitChanges) this.state.set(APIProvider.State.CONNECTED);
  }

  async stop(emitChanges = true) {
    const [primaryWallet] = this.onboard.state.get().wallets;
    if (!primaryWallet) return;
    await this.onboard.disconnectWallet({ label: primaryWallet.label });
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
      await this.onboard.setChain({ chainId: currentChainId });

      this.provider.on("chainChanged", () => {
        this.state.set(APIProvider.State.DISCONNECTED);
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
    return await tx.wait();
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
    let userAddress = await this.getAddress();
    return await this.provider.getTransactionCount(userAddress);
  }

  async signOrder({ orderHash }) {
    const result = await this.wallet.signMessage(ethers.utils.arrayify(orderHash));
    return result;
  }

  async wrap(amount, contractAddr, decimals) {
    const contract = new ethers.Contract(contractAddr, WETHContractABI, this.wallet);
    amount = Decimal.mul(amount, Decimal.pow(10, decimals)).toString();
    const tx = await contract.deposit({ value: amount });
    return await tx.wait();
  }

  async unwrap(amount, contractAddr, decimals) {
    const contract = new ethers.Contract(contractAddr, WETHContractABI, this.wallet);
    amount = Decimal.mul(amount, Decimal.pow(10, decimals)).toString();
    const tx = await contract.withdraw(amount);
    return await tx.wait();
  }

  async getEvents(contractAddr, eventName, fromBlock, toBlock) {
    const contract = new ethers.Contract(contractAddr, WETHContractABI, this.provider);
    let filterFromMe = contract.filters[eventName](await this.getAddress(), null);
    const logs = await contract.queryFilter(filterFromMe, fromBlock, toBlock);
    return logs;
  }

  async subscribeToEvent(contractAddr) {
    const contract = new ethers.Contract(contractAddr, WETHContractABI, this.provider);
    contract.on("Deposit", (dst, wad, event) => {
      return {
        from: dst,
        amount: wad.toString(),
        event,
      };
    });
  }

  onAccountChange = cb => {
    if (this.state.get() === APIProvider.State.CONNECTED) this.provider.provider.on("accountsChanged", cb);
  };

}
