import Decimal from "decimal.js";
import * as zksync from "zksync";
import axios from "axios";
import { ethers } from "ethers";

import APIProvider from "./APIProvider";
import EthAPIProvider from "./EthAPIProvider";
import Currencies from "config/Currencies";
import { minimumBalances } from "lib/constants";

export default class ZKSyncAPIProvider extends EthAPIProvider {

  static seedStorageKey = "@ZZ/ZKSYNC_SEEDS";
  ZKSYNC_BASE_URL = "https://api.zksync.io/api/v0.2";

  syncWallet = null;
  syncProvider = null;
  _tokenWithdrawFees = {};

  async start(infuraId) {
    this.state.set(APIProvider.State.CONNECTING);

    await super.start(infuraId, false);

    try {
      this.syncProvider = await zksync.getDefaultProvider(this.NETWORK_NAME);
    } catch (e) {
      this.networkInterface.core.run("notify", "error", `Connection to zkSync network ${this.NETWORK_NAME} is lost`);
      throw e;
    }

    try {
      const { seed, ethSignatureType } = await this.getSeed();
      const syncSigner = await zksync.Signer.fromSeed(seed);
      this.syncWallet = await zksync.Wallet.fromEthSigner(
        this.wallet,
        this.syncProvider,
        syncSigner,
        undefined,
        ethSignatureType,
      );
    } catch (err) {
      console.log(err);
      throw err;
    }

    this.state.set(APIProvider.State.CONNECTED);
  }

  async stop() {
    await super.stop(false);
    delete this.syncProvider;
    delete this.syncWallet;
    this.state.set(APIProvider.State.DISCONNECTED);
  }

  async getAddress() {
    const address = this.syncWallet?.cachedAddress ?? (await this.wallet?.getAddress());
    return ethers.utils.getAddress(address);
  }

  async isActivated() {
    return this.syncWallet?.isSigningKeySet();
  }

  async getTransactionState(txHash) {
    const { data } = await axios.get(`https://api.zksync.io/api/v0.2/transactions/${txHash}`);
    return data.result.state;
  }

  async getTransactionFee(txType) {
    const { data } = await axios.post(
      "https://api.zksync.io/api/v0.2/fee",
      {
        txType,
        address: this.syncWallet.ethSigner.address,
        tokenLike: "USDC", //can be change
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const feeUSD = data.result.totalFee / 10 ** 6;
    return feeUSD;
  }

  async signOrder({ sellCurrency, buyCurrency, ratio, validUntil }) {
    const result = await this.syncWallet?.signLimitOrder({
      tokenSell: sellCurrency,
      tokenBuy: buyCurrency,
      ratio,
      validUntil,
    });
    return result;
  }

  async changePubKeyFee(currency = "USDC") {
    const { data } = await axios.post(
      this.ZKSYNC_BASE_URL + "/fee",
      {
        txType: { ChangePubKey: "ECDSA" },
        address: "0x5364ff0cecb1d44efd9e4c7e4fe16bf5774530e3",
        tokenLike: currency,
      },
      { headers: { "Content-Type": "application/json" } },
    );

    if (currency === "USDC") return (data.result.totalFee / 10 ** 6) * 2;
    else return (data.result.totalFee / 10 ** 18) * 2;
  }

  async activateAccount(accountState) {
    if (this.networkInterface.NETWORK === "zksyncv1") {
      try {
        const { data } = await axios.post(
          "https://api.zksync.io/api/v0.2/fee",
          {
            txType: { ChangePubKey: "ECDSA" },
            address: this.syncWallet.ethSigner.address,
            tokenLike: "USDC", //can be change
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        const feeUSD = data.result.totalFee / 10 ** 6;
        this.networkInterface.core.run(
          "notify",
          "info",
          `You need to sign a one-time transaction to activate your zksync account. The fee for this tx will be $${feeUSD.toFixed(
            2,
          )}`,
        );
      } catch (err) {
        this.networkInterface.core.run(
          "notify",
          "info",
          "You need to sign a one-time transaction to activate your zksync account. The fee for this tx will be ~$2.5",
        );
      }
    } else if (this.networkInterface.NETWORK === "zksyncv1_goerli") {
      this.networkInterface.core.run(
        "notify",
        "info",
        "You need to sign a one-time transaction to activate your zksync account.",
      );
    }
    const _accountState = accountState || (await this.syncWallet?.getAccountState());
    const balances = _accountState.committed.balances;
    let feeToken;
    for (let prop in minimumBalances) {
      const balance = balances[prop];
      const minimum = minimumBalance[prop];
      if (balance && balance > minimum) {
        feeToken = prop;
      }
    }
    if (!feeToken) {
      this.networkInterface.core.run(
        "notify",
        "warning",
        "Your token balances are very low. You might need to bridge in more funds first.",
      );
      feeToken = "ETH";
    }

    const signingKey = await this.syncWallet.setSigningKey({
      feeToken,
      ethAuthType: "ECDSALegacyMessage",
    });

    await signingKey.awaitReceipt();
    if (!signingKey) throw new Error("Address not activated");

    return signingKey;
  }

  async withdrawL2(amount, address, token = "ETH") {
    if (!amount) return;
    try {
      return await this.syncWallet.withdrawFromSyncToEthereum({
        token,
        ethAddress: address,
        amount,
      });
    } catch (err) {
      console.log("ZKSync L2 withdraw error:", err);
      throw err;
    }
  }

  async depositL2(amount, address, token = "ETH") {
    if (!amount) return;
    try {
      return await this.syncWallet.depositToSyncFromEthereum({
        token,
        depositTo: address,
        amount,
      });
    } catch (err) {
      console.log("ZKSync L2 deposit error:", err);
      throw err;
    }
  }

  async getBridgeReceiptStatus(receipt, type) {
    let url;
    let statusReceipt = {};
    let statusReceipts = [];

    if (this.network === "zksyncv1") url = "https://api.zksync.io/api/v0.2";
    else url = "https://goerli-api.zksync.io/api/v0.2";

    if (type === "deposit") statusReceipt.hash = receipt.ethTx.hash;
    else statusReceipt.hash = receipt.txHash;
    const { data } = await axios.get(`${url}/transactions/${statusReceipt.hash}`).catch(e => {
      console.log(`Request to ${e.config.url} failed with status code ${e.response.status}`);
    });
    if (!data) return;
    if (data.result) {
      statusReceipt.status = data.result.status;
      statusReceipts.push(statusReceipt);
    }
    if (data.result === null) {
      statusReceipt.status = data.status;
      statusReceipts.push(statusReceipt);
    }
    console.log(`status receipt : ${JSON.stringify(statusReceipts)}`);
    return statusReceipt;
  }

  async depositL2Fee(token = "ETH") {
    return 0;
  }

  async withdrawL2Fee(token = "ETH") {
    if (!this._tokenWithdrawFees[token]) {
      const fee = await this.syncProvider.getTransactionFee("Withdraw", [this.syncWallet.address()], token);

      const totalFee = new Decimal(parseInt(fee.totalFee));
      this._tokenWithdrawFees[token] = totalFee.div(10 ** Currencies[token].decimals);
    }

    return this._tokenWithdrawFees[token];
  }

  getSeeds() {
    try {
      return JSON.parse(window.localStorage.getItem(ZKSyncAPIProvider.seedStorageKey) || "{}");
    } catch {
      return {};
    }
  }

  async getSeedKey() {
    return `${this.networkInterface.NETWORK}-${await this.getAddress()}`;
  }

  async getSeed() {
    const seedKey = await this.getSeedKey();
    let seeds = this.getSeeds();

    if (!seeds[seedKey]) {
      seeds[seedKey] = await this.genSeed();
      seeds[seedKey].seed = seeds[seedKey].seed
        .toString()
        .split(",")
        .map(x => +x);
      window.localStorage.setItem(ZKSyncAPIProvider.seedStorageKey, JSON.stringify(seeds));
    }

    seeds[seedKey].seed = Uint8Array.from(seeds[seedKey].seed);
    return seeds[seedKey];
  }

  async genSeed() {
    const { wallet } = this;
    let chainID = 1;
    if (wallet.provider) {
      const network = await wallet.provider.getNetwork();
      chainID = network.chainId;
    }
    let message = "Access zkSync account.\n\nOnly sign this message for a trusted client!";
    if (chainID !== 1) {
      message += `\nChain ID: ${chainID}.`;
    }
    const signedBytes = zksync.utils.getSignedBytesFromMessage(message, false);
    const signature = await zksync.utils.signMessagePersonalAPI(wallet, signedBytes);
    const address = await wallet.getAddress();
    const ethSignatureType = await zksync.utils.getEthSignatureType(wallet.provider, message, signature, address);
    const seed = ethers.utils.arrayify(signature);
    return { seed, ethSignatureType };
  }

  async increaseWalletNonce() {
    // const token = "ETH";
    // const memo = "";
    // const walletAddress = await this.ethWallet.getAddress();
    // //fee is optional
    // const fee = zksync.utils.closestPackableTransactionFee(ethers.utils.parseEther("0.001"))
    //with zero amount for increase nonce
    const transfer = await this.syncWallet.syncTransfer({
      to: this.syncWallet?.address(),
      token: "ETH",
      amount: "0",
    });
    const transferReceipt = await transfer.awaitReceipt();

    return transferReceipt;
  }

  getParsedSellQuantity(tokenSell, sellQuantity) {
    const parsedSellQuantity = this.syncProvider.tokenSet.parseToken(
      tokenSell,
      sellQuantity.toFixed(Currencies[tokenSell].decimals),
    );

    return parsedSellQuantity;
  }

  getAccountState = async () => {
    const accountState = await this.syncWallet?.getAccountState();
    return accountState;
  };

}
