import Decimal from "decimal.js";
import * as zksync from "zksync";
import axios from "axios";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

import { toBaseUnit } from "lib/utils";
import APIProvider from "./APIProvider";
import { maxAllowance } from "../constants";

export default class ZKSyncAPIProvider extends APIProvider {
  static seedStorageKey = "@ZZ/ZKSYNC_SEEDS";
  static validSides = ["b", "s"];
  NETWORK = "zksyncv1";
  NETWORK_NAME = "mainnet";
  BRIDGE_CONTRACT = "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF";
  HAS_BRIDGE = true;
  ZKSYNC_BASE_URL = "https://api.zksync.io/api/v0.2";

  syncWallet = null;
  syncProvider = null;
  zksyncCompatible = true;
  accountState = null;
  _tokenWithdrawFees = {};

  constructor(api, onStateChange /*, infuraId*/) {
    super(api, onStateChange);
    // this.infuraId = infuraId;
  }

  start = async () => {
    this.state.set(APIProvider.State.CONNECTING);
    console.log("here0", Date.now() % 10000);

    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID, // this.infuraId,
        },
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

    const web3Modal = new Web3Modal({
      network: "any",
      cacheProvider: true,
      providerOptions,
      theme: "dark",
    });
    this.web3Modal = web3Modal;

    const provider = await web3Modal.connect();

    this.provider = new ethers.providers.Web3Provider(provider);

    const networkChanged = await this.switchNetwork();

    if (networkChanged) return await this.start();

    const signer = this.provider.getSigner();
    
    // const address = await signer.getAddress();

    // const network = await this.provider.getNetwork();

    this.wallet = signer;

    try {
      this.syncProvider = await zksync.getDefaultProvider(this.NETWORK_NAME);
    } catch (e) {
      toast.error(`Connection to zkSync network ${this.NETWORK_NAME} is lost`);
      throw e;
    }

    // console.log("here1", Date.now() % 10000);

    try {
      const { seed, ethSignatureType } = await this.getSeed();
      const syncSigner = await zksync.Signer.fromSeed(seed);
      this.syncWallet = await zksync.Wallet.fromEthSigner(
        this.wallet,
        this.syncProvider,
        syncSigner,
        undefined,
        ethSignatureType
      );
    } catch (err) {
      console.log(err);
      throw err;
    }

    // console.log("here2", Date.now() % 10000);

    let result;
    const accountState = await this.getAccountState();
    if (!accountState.id) {
      result = "redirectToBridge";
    } else {
      const isActivated = await this.syncWallet.isSigningKeySet();
      if (!isActivated) await this.activateAccount(accountState);
    }

    // console.log("here3", Date.now() % 10000);

    this.state.set(APIProvider.State.CONNECTED);
    return result;
  };

  stop = async () => {
    // this.web3Modal.clearCachedProvider();
    delete this.provider;
    delete this.wallet;
    delete this.syncProvider;
    delete this.syncWallet;
    this.state.set(APIProvider.State.DISCONNECTED);
  };

  getAddress = async () => {
    return this.syncWallet?.cachedAddress ?? (await this.wallet?.getAddress());
  };

  signMessage = async (message) => {
    const address = await this.getAddress();
    try {
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });
      return signature;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  verifyMessage = async (message, signature) => {
    const address = await this.getAddress();
    try {
      const signedAddress = ethers.utils.verifyMessage(message, signature);
      return signedAddress.toLowerCase() === address.toLowerCase();
    } catch (err) {
      console.error("Error on verifying signature:", err);
      return false;
    }
  };

  getTransactionState = async (txHash) => {
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
    let buyWithFee,
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

    const order = await this.syncWallet.signLimitOrder({
      tokenSell,
      tokenBuy,
      ratio,
      validUntil,
    });

    return {
      tx: order,
      market: product,
      amount: parsedQuantity.toString(),
      price: price,
      type: orderType,
    };
  };

  getBalances = async () => {
    const account = await this.getAccountState();
    // console.log("accountState", account);
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
    let accountState = (await this.syncWallet?.getAccountState()) ?? {};
    return accountState;
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
      this.ZKSYNC_BASE_URL + "/fee",
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

  activateAccount = async (accountState) => {
    if (this.NETWORK === "zksyncv1") {
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
    } else if (this.NETWORK === "zksyncv1_goerli") {
      toast.info(
        "You need to sign a one-time transaction to activate your zksync account."
      );
    }
    let feeToken = "ETH";
    const _accountState =
      accountState || (await this.syncWallet?.getAccountState());
    const balances = _accountState.committed.balances;
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
    const checksumAddress = ethers.utils.getAddress(
      this.api._accountState.address
    );
    if (amount) {
      try {
        transfer = await this.syncWallet.withdrawFromSyncToEthereum({
          token,
          ethAddress: await this.getAddress(),
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
            checksumAddress,
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
    const checksumAddress = ethers.utils.getAddress(
      this.api._accountState.address
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
            checksumAddress,
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

  getSeeds = () => {
    try {
      return JSON.parse(
        window.localStorage.getItem(ZKSyncAPIProvider.seedStorageKey) || "{}"
      );
    } catch {
      return {};
    }
  };

  getSeedKey = async () => {
    return `${this.network}-${await this.getAddress()}`;
  };

  getSeed = async () => {
    const seedKey = await this.getSeedKey();
    let seeds = this.getSeeds();

    if (!seeds[seedKey]) {
      seeds[seedKey] = await this.genSeed();
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

  genSeed = async () => {
    const { wallet } = this;
    let chainID = 1;
    if (wallet.provider) {
      const network = await wallet.provider.getNetwork();
      chainID = network.chainId;
    }
    let message =
      "Access zkSync account.\n\nOnly sign this message for a trusted client!";
    if (chainID !== 1) {
      message += `\nChain ID: ${chainID}.`;
    }
    const signedBytes = zksync.utils.getSignedBytesFromMessage(message, false);
    const signature = await zksync.utils.signMessagePersonalAPI(
      wallet,
      signedBytes
    );
    const address = await wallet.getAddress();
    const ethSignatureType = await zksync.utils.getEthSignatureType(
      wallet.provider,
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

  onAccountChange = (cb) => {
    if (this.state.get() === APIProvider.State.CONNECTED)
      this.provider.provider.on("accountsChanged", cb);
  };

  switchNetwork = async () => {
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
