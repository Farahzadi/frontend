import get from "lodash/get";
import Decimal from "decimal.js";
import * as zksync from "zksync";
import axios from "axios";
import Web3 from "web3";

import { ethers } from "ethers";
import { toast } from "react-toastify";
import { toBaseUnit } from "lib/utils";
import APIProvider from "./APIProvider";
import { maxAllowance } from "../constants";
import axios from "axios";

export default class ZKSyncAPIProvider extends APIProvider {
  static seedStorageKey = "@ZZ/ZKSYNC_SEEDS";
  static validSides = ["b", "s"];

  BRIDGE_CONTRACT = "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF";

  ethWallet = null;
  syncWallet = null;
  syncProvider = null;
  signedMsg = null;
  zksyncCompatible = true;
  accountState = null;
  _tokenWithdrawFees = {};

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

  handleBridgeReceipt = (
    _receipt,
    amount,
    token,
    type,
    userId,
    userAddress,
    status
  ) => {
    let receipt = {
      date: +new Date(),
      network: this.network,
      amount,
      token,
      type,
      userId,
      userAddress,
      _receipt,
      status,
    };
    const subdomain = this.network === "zksyncv1" ? "" : "goerli.";
    if (!_receipt) {
      return receipt;
    }
    if (_receipt.ethTx) {
      receipt.txId = _receipt.ethTx.hash;
      receipt.txUrl = `https://${subdomain}etherscan.io/tx/${receipt.txId}`;
    } else if (_receipt.txHash) {
      receipt.txId = _receipt.txHash.split(":")[1];
      receipt.txUrl = `https://${subdomain}zkscan.io/explorer/transactions/${receipt.txId}`;
    }

    return receipt;
  };

  changePubKeyFee = async (currency = "USDC") => {
    const { data } = await axios.post(
      this.getZkSyncBaseUrl(this.network) + "/fee",
      {
        txType: { ChangePubKey: "ECDSA" },
        address: "0x5364ff0cecb1d44efd9e4c7e4fe16bf5774530e3",
        tokenLike: currency,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    if (currency === "USDC") return (data.result.totalFee / 10 ** 6) * 2;
    else return (data.result.totalFee / 10 ** 18) * 2;
  };

  changePubKey = async () => {
    if (this.network === "zksyncv1") {
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
          }
        );
        const feeUSD = data.result.totalFee / 10 ** 6;
        toast.info(
          `You need to sign a one-time transaction to activate your zksync account. The fee for this tx will be $${feeUSD.toFixed(
            2
          )}`
        );
      } catch (err) {
        toast.info(
          `You need to sign a one-time transaction to activate your zksync account. The fee for this tx will be ~$2.5`
        );
      }
    } else if (this.network === "zksyncv1_goerli") {
      toast.info(
        "You need to sign a one-time transaction to activate your zksync account."
      );
    }
    let feeToken = "ETH";
    const accountState = await this.syncWallet.getAccountState();
    const balances = accountState.committed.balances;
    if (balances.ETH && balances.ETH > 0.005e18) {
      feeToken = "ETH";
    } else if (balances.USDC && balances.USDC > 20e6) {
      feeToken = "USDC";
    } else if (balances.USDT && balances.USDT > 20e6) {
      feeToken = "USDT";
    } else if (balances.DAI && balances.DAI > 20e6) {
      feeToken = "DAI";
    } else if (balances.WBTC && balances.WBTC > 0.0003e8) {
      feeToken = "WBTC";
    } else {
      toast.warn(
        "Your token balances are very low. You might need to bridge in more funds first."
      );
      feeToken = "ETH";
    }

    const signingKey = await this.syncWallet.setSigningKey({
      feeToken,
      ethAuthType: "ECDSALegacyMessage",
    });

    await signingKey.awaitReceipt();
    if (signingKey) {
      toast.success("Your address is succesfully registered!.");
    }

    return signingKey;
  };

  signMessage = async () => {
    const message = "Login to Dexpresso";
    if (
      sessionStorage.getItem("login") === null ||
      this.api.changingWallet === true
    ) {
      try {
        const from = this.syncWallet.cachedAddress;
        this.signedMsg = await window.ethereum.request({
          method: "personal_sign",
          params: [message, from],
        });
        sessionStorage.setItem("login", this.signedMsg);
      } catch (err) {
        console.error(err);
      }
    }
  };

  verifyMessage = async () => {
    const message = "Login to Dexpresso";
    try {
      const from = this.syncWallet.cachedAddress;
      new TextEncoder("utf-8").encode(message).toString("hex");
      const recoveredAddr = await Web3.eth.accounts.recover(
        message,
        this.globalSignature
      );

      if (recoveredAddr.toLowerCase() === from.toLowerCase()) {
        console.log(`Successfully ecRecovered signer as ${recoveredAddr}`);
      } else {
        console.log(
          `Failed to verify signer when comparing ${recoveredAddr} to ${from}`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  getTransactionState = async (txHash) => {
    // const subdomain = this.network === "zksyncv1" ? "" : "goerli.";
    const { data } = await axios.get(
      `https://api.zksync.io/api/v0.2/transactions/${txHash}`
    );
    return data.result.state;
  };

  getTransactionFee = async (txType) => {
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
      }
    );
    const feeUSD = data.result.totalFee / 10 ** 6;
    return feeUSD;
  };

  submitOrder = async (
    product,
    side,
    price,
    amount,
    feeType,
    fee,
    orderType
  ) => {
    let feeOrder,
      buyWithFee,
      sellWithFee,
      tokenBuy,
      tokenSell,
      quantity,
      tokenRatio,
      priceWithFee = 0;

    amount = new Decimal(parseFloat(amount));
    price = new Decimal(parseFloat(price).toPrecision(8));

    buyWithFee = price.mul(1 + fee);
    sellWithFee = price.mul(1 - fee);

    const feeTokenRatio = {};
    const currencies = product.split("-");
    const nowUnix = (Date.now() / 1000) | 0;
    const validUntil = nowUnix + 24 * 3600;

    if (currencies[0] === "USDC" || currencies[0] === "USDT") {
      amount = amount.toFixed(7).slice(0, -1);
    }

    if (!ZKSyncAPIProvider.validSides.includes(side)) {
      throw new Error("Invalid side");
    }

    if (side === "b") {
      [tokenBuy, tokenSell] = currencies;
      quantity = parseFloat(amount.mul(price));
    }

    if (side === "s") {
      [tokenSell, tokenBuy] = currencies;
      quantity = parseFloat(amount);
    }

    const parsedQuantity = this.syncProvider.tokenSet.parseToken(
      tokenSell,
      quantity.toString()
    );

    priceWithFee = side === "b" ? buyWithFee : sellWithFee;
    tokenRatio = this.getTokenRatio(product, 1, priceWithFee.toString());
    const ratio = zksync.utils.tokenRatio(tokenRatio);

    if (sessionStorage.getItem("login") === null) {
      return;
    }

    //DAI will be NBX!
    feeTokenRatio[tokenSell] = 1;
    feeTokenRatio["DAI"] = (0).toPrecision(6).toString();
    if (feeType === "withNBX") {
      feeOrder = await this.syncWallet.signLimitOrder({
        tokenSell: tokenSell,
        tokenBuy: "DAI",
        ratio: zksync.utils.tokenRatio(feeTokenRatio),
        validUntil,
      });
    }

    const order = await this.syncWallet.signLimitOrder({
      tokenSell,
      tokenBuy,
      ratio,
      validUntil,
    });

    this.api.sendRequest(
      "user/order",
      "POST",
      {
        tx: order,
        market: product,
        amount: parsedQuantity.toString(),
        price: price,
        type: orderType,
      },
      true
    );

    return order;
  };

  getBalances = async () => {
    const account = await this.getAccountState();
    console.log("accountState", account);
    const balances = {};

    Object.keys(this.api.currencies).forEach((ticker) => {
      const currency = this.api.currencies[ticker];
      const balance = new Decimal(
        account && account.committed
          ? account.committed.balances[ticker] || 0
          : 0
      );

      balances[ticker] = {
        value: balance,
        valueReadable: balance && balance.div(10 ** currency.decimals),
        allowance: maxAllowance,
      };
    });

    return balances;
  };

  getAccountState = async () => {
    return this.syncWallet ? this.syncWallet.getAccountState() : {};
  };

  getChainName = () => {
    return "mainnet";
  };

  getZkSyncBaseUrl = (chainId) => {
    if (this.getChainName(chainId) === "mainnet") {
      return "https://api.zksync.io/api/v0.2";
    } else if (this.getChainName(chainId) === "goerli") {
      return "https://goerli-api.zksync.io/api/v0.2";
    } else {
      throw Error("Uknown chain");
    }
  };

  getCommitedBalance = async () => {
    const balance = await this.syncWallet.getCommitedBalance();
    console.log(`this is sync wallet commited balance: ${balance}`);
    return balance;
  };

  withdrawL2 = async (amountDecimals, token = "ETH") => {
    let transfer;
    let bridgeReceiptData = {};

    const amount = toBaseUnit(
      amountDecimals,
      this.api.currencies[token].decimals
    );
    if (amount) {
      try {
        transfer = await this.syncWallet.withdrawFromSyncToEthereum({
          token,
          ethAddress: await this.ethWallet.getAddress(),
          amount,
        });

        await this.getBridgeReceiptStatus(transfer, "withdraw").then((data) => {
          bridgeReceiptData.status = data.status;
        });

        this.api.emit(
          "bridgeReceipt",
          this.handleBridgeReceipt(
            transfer,
            amountDecimals,
            token,
            "withdraw",
            this.api._accountState.id,
            this.api._accountState.address,
            bridgeReceiptData.status
          )
        );

        return transfer;
      } catch (err) {
        console.log(err);
      }
    }
  };

  depositL2 = async (amountDecimals, token = "ETH") => {
    let transfer;
    let bridgeReceiptData = {};

    const amount = toBaseUnit(
      amountDecimals,
      this.api.currencies[token].decimals
    );
    if (amount) {
      try {
        transfer = await this.syncWallet.depositToSyncFromEthereum({
          token,
          depositTo: this.syncWallet.address(),
          amount,
        });

        await this.getBridgeReceiptStatus(transfer, "deposit").then((data) => {
          bridgeReceiptData.status = data.status;
        });

        this.api.emit(
          "bridgeReceipt",
          this.handleBridgeReceipt(
            transfer,
            amountDecimals,
            token,
            "deposit",
            this.api._accountState.id,
            this.api._accountState.address,
            bridgeReceiptData.status
          )
        );

        return transfer;
      } catch (err) {
        console.log(err);
      }
    }
  };

  getBridgeReceiptStatus = async (receipt, type) => {
    let url;
    let statusReceipt = {};
    let statusReceipts = [];

    if (this.network === "zksyncv1") url = "https://api.zksync.io/api/v0.2";
    else url = "https://goerli-api.zksync.io/api/v0.2";

    if (type === "deposit") statusReceipt.hash = receipt.ethTx.hash;
    if (type !== "deposit") statusReceipt.hash = receipt.txHash;
    const { data } = await axios
      .get(`${url}/transactions/${statusReceipt.hash}`)
      .catch((e) => {
        console.log(
          `Request to ${e.config.url} failed with status code ${e.response.status}`
        );
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
  };

  depositL2Fee = async (token = "ETH") => {
    return 0;
  };

  withdrawL2Fee = async (token = "ETH") => {
    if (!this._tokenWithdrawFees[token]) {
      const fee = await this.syncProvider.getTransactionFee(
        "Withdraw",
        [this.syncWallet.address()],
        token
      );

      const totalFee = new Decimal(parseInt(fee.totalFee));
      this._tokenWithdrawFees[token] = totalFee.div(
        10 ** this.api.currencies[token].decimals
      );
    }

    return this._tokenWithdrawFees[token];
  };

  signIn = async () => {
    try {
      this.syncProvider = await zksync.getDefaultProvider(
        this.getChainName()
      );
    } catch (e) {
      toast.error(
        `Connection to zkSync network ${
          this.network === "zksyncv1_goerli" ? "goerli" : "mainnet"
        } is lost`
      );
      throw e;
    }

    try {
      this.ethWallet = this.api.ethersProvider.getSigner();
      const { seed, ethSignatureType } = await this.getSeed(this.ethWallet);
      const syncSigner = await zksync.Signer.fromSeed(seed);
      this.syncWallet = await zksync.Wallet.fromEthSigner(
        this.ethWallet,
        this.syncProvider,
        syncSigner,
        undefined,
        ethSignatureType
      );
    } catch (err) {
      console.log(err);
      throw err;
    }

    const accountState = await this.api.getAccountState();
    if (!accountState.id) {
      if (!/^\/bridge(\/.*)?$/.test(window.location.pathname)) {
        toast.error(
          "Account not found. Please use the bridge to deposit funds before trying again."
        );
      }
    } else {
      const signingKeySet = await this.syncWallet.isSigningKeySet();
      if (!signingKeySet) {
        await this.changePubKey();
      }
    }
    this.accountState = accountState;

    return accountState;
  };

  getSeeds = () => {
    try {
      return JSON.parse(
        window.localStorage.getItem(ZKSyncAPIProvider.seedStorageKey) || "{}"
      );
    } catch {
      return {};
    }
  };

  getSeedKey = async (ethSigner) => {
    return `${this.network}-${await ethSigner.getAddress()}`;
  };

  getSeed = async (ethSigner) => {
    const seedKey = await this.getSeedKey(ethSigner);
    let seeds = this.getSeeds(ethSigner);

    if (!seeds[seedKey]) {
      seeds[seedKey] = await this.genSeed(ethSigner);
      seeds[seedKey].seed = seeds[seedKey].seed
        .toString()
        .split(",")
        .map((x) => +x);
      window.localStorage.setItem(
        ZKSyncAPIProvider.seedStorageKey,
        JSON.stringify(seeds)
      );
    }

    seeds[seedKey].seed = Uint8Array.from(seeds[seedKey].seed);
    return seeds[seedKey];
  };

  genSeed = async (ethSigner) => {
    let chainID = 1;
    if (ethSigner.provider) {
      const network = await ethSigner.provider.getNetwork();
      chainID = network.chainId;
    }
    let message =
      "Access zkSync account.\n\nOnly sign this message for a trusted client!";
    if (chainID !== 1) {
      message += `\nChain ID: ${chainID}.`;
    }
    const signedBytes = zksync.utils.getSignedBytesFromMessage(message, false);
    const signature = await zksync.utils.signMessagePersonalAPI(
      ethSigner,
      signedBytes
    );
    const address = await ethSigner.getAddress();
    const ethSignatureType = await zksync.utils.getEthSignatureType(
      ethSigner.provider,
      message,
      signature,
      address
    );
    const seed = ethers.utils.arrayify(signature);
    return { seed, ethSignatureType };
  };

  increaseWalletNonce = async () => {
    // const token = "ETH";
    // const memo = "";
    // const walletAddress = await this.ethWallet.getAddress();
    // //fee is optional
    // const fee = zksync.utils.closestPackableTransactionFee(ethers.utils.parseEther('0.001'))

    //with zero amount for increase nonce
    const transfer = await this.syncWallet.syncTransfer({
      to: this.syncWallet.address(),
      token: "ETH",
      amount: 0,
    });
    const transferReceipt = await transfer.awaitReceipt();

    return transferReceipt;
  };

  getTokenRatio = (product, baseRatio, quoteRatio) => {
    let tokenRatio = {};
    const currencies = product.split("-");
    const baseCurrency = currencies[0];
    const quoteCurrency = currencies[1];

    tokenRatio[baseCurrency] = baseRatio;
    tokenRatio[quoteCurrency] = quoteRatio;

    return tokenRatio;
  };

  getParsedSellQuantity = (tokenSell, sellQuantity) => {
    const parsedSellQuantity = this.syncProvider.tokenSet.parseToken(
      tokenSell,
      sellQuantity.toFixed(this.api.currencies[tokenSell].decimals)
    );

    return parsedSellQuantity;
  };
}
