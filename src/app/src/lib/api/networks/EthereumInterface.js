import { SecurityTypeList } from "components/pages/Security/types";
import { getNetworkCurrencies, getNetworkCurrency } from "config/Currencies";
import Decimal from "decimal.js";
import { BigNumber, ethers } from "ethers";
import { getENSName } from "lib/ens";
import { setAllowance } from "lib/store/features/api/apiSlice";
import { formatBalances, getCurrentValidUntil, getValueReadable, switchRatio } from "lib/utils";
import { toast } from "react-toastify";
import { approve } from "../Actions";
import { maxAllowance } from "../constants";
import EthAPIProvider from "../providers/EthAPIProvider";
import NetworkInterface from "./NetworkInterface";

const ETHEREUM_DEX_CONTRACT = process.env.REACT_APP_ETHEREUM_DEX_CONTRACT;
export default class EthereumInterface extends NetworkInterface {

  static Actions = [...super.Actions, approve, "wrapToken", "unwrapToken", "getEvent"];
  static Provider = EthAPIProvider;
  NETWORK = "ethereum";
  CURRENCY = "ETH";
  CHAIN_ID = 1;
  HAS_CONTRACT = true;
  HAS_WRAPPER = true;
  DEX_CONTRACT = ETHEREUM_DEX_CONTRACT;
  SECURITY_TYPE = SecurityTypeList.allowance;
  EVENTS_NAME = ["Deposit", "Withdrawal"];

  async fetchBalance(ticker, userAddress, isLayerTwo = false) {
    const currency = getNetworkCurrency(this.NETWORK, ticker);
    if (!currency) return "0";
    let balance;
    if (ticker === this.CURRENCY) balance = await this.apiProvider.getBalance(userAddress);
    else
      balance = await this.apiProvider.getTokenBalance(
        !this.HAS_BRIDGE || !isLayerTwo ? currency.info.contract : currency.info.L2Contract,
        userAddress,
      );
    return balance.toString();
  }

  async fetchBalances(isLayerTwo = false) {
    if (!this.apiProvider) return null;
    const userAddress = await this.apiProvider.getAddress();
    const currencies = getNetworkCurrencies(this.NETWORK);
    const entriesPromises = Object.keys(currencies).map(async ticker => [
      ticker,
      await this.fetchBalance(ticker, userAddress, isLayerTwo),
    ]);
    const entries = await Promise.all(entriesPromises);
    const balances = Object.fromEntries(entries);
    return balances;
  }

  async updatePureBalances() {
    if (!this.apiProvider) return;
    const currencies = getNetworkCurrencies(this.NETWORK);
    const balances = await this.fetchBalances();
    this.userDetails.balances = formatBalances(balances, currencies);
  }

  async fetchAllowance(ticker, userAddress, isLayerTwo = false) {
    const currency = getNetworkCurrency(this.NETWORK, ticker);
    if (!currency || ticker === this.CURRENCY) return "0";
    const allowance = await this.apiProvider.getAllowance(
      !this.HAS_BRIDGE || !isLayerTwo ? currency.info.contract : currency.info.L2Contract,
      userAddress,
      !this.HAS_BRIDGE || isLayerTwo ? this.DEX_CONTRACT : this.BRIDGE_CONTRACT,
    );
    return allowance.toString();
  }

  async fetchAllowances(isLayerTwo = false) {
    if (!this.apiProvider) return null;
    const userAddress = await this.apiProvider.getAddress();
    const currencies = getNetworkCurrencies(this.NETWORK);
    const entriesPromises = Object.keys(currencies).map(async ticker => [
      ticker,
      await this.fetchAllowance(ticker, userAddress, isLayerTwo),
    ]);
    const entries = await Promise.all(entriesPromises);
    const allowances = Object.fromEntries(entries);
    return allowances;
  }

  async approve(ticker, allowance, isLayerTwo = false) {
    const currency = getNetworkCurrency(this.NETWORK, ticker);
    if (!currency || ticker === this.CURRENCY) return;
    allowance = BigNumber.from(allowance ?? maxAllowance);
    return await this.apiProvider
      ?.approve(
        !this.HAS_BRIDGE || !isLayerTwo ? currency.info.contract : currency.info.L2Contract,
        !this.HAS_BRIDGE || isLayerTwo ? this.DEX_CONTRACT : this.BRIDGE_CONTRACT,
        allowance,
      )
      .then(
        res => {
          if (res) {
            let newAllowance = {
              value: allowance,
              valueReadable: getValueReadable(allowance, ticker),
            };
            this.emit(setAllowance, newAllowance, ticker);
            return true;
          }
          return false;
        },
        error => {
          console.log(error);
          return false;
        },
      );
  }

  async _updateChainDetails() {
    if (!this.apiProvider) return;
    const currencies = getNetworkCurrencies(this.NETWORK);
    const allowances = await this.fetchAllowances();
    if (!this.userDetails.chainDetails) this.userDetails.chainDetails = {};
    this.userDetails.chainDetails = {
      ...this.userDetails.chainDetails,
      allowances: formatBalances(allowances, currencies),
    };
  }

  // async getProfileImage(address) {
  //   try {
  //     const { data } = await axios.get(
  //       `https://ipfs.3box.io/profile?address=${address}`
  //     );
  //     const image = get(data, "image.0.contentUrl./");
  //     if (!data || !image) throw new Error();
  //     const result = `https://gateway.ipfs.io/ipfs/${image}`;
  //     return result;
  //   } catch (err) {
  //     return await super.getProfileImage(address);
  //   }
  //   // const profile = {
  //   //   coverPhoto: get(data, "coverPhoto.0.contentUrl./"),
  //   //   image: get(data, "image.0.contentUrl./"),
  //   //   description: data.description,
  //   //   emoji: data.emoji,
  //   //   website: data.website,
  //   //   location: data.location,
  //   //   twitter_proof: data.twitter_proof,
  //   // };
  // }

  async fetchENSName(address) {
    try {
      return await getENSName(address);
    } catch (err) {
      console.log(`ENS error: ${err}`);
      return null;
    }
  }

  async getProfileName(address) {
    return (await this.fetchENSName(address)) ?? (await super.getProfileName(address));
  }

  async validateOrder({ market, price, amount, side, fee, type }) {
    if (!this.apiProvider) return null;
    const res = await super.validateOrder({
      market,
      price,
      amount,
      side,
      fee,
      type,
    });
    const compareAmount = side === "s" ? res.amount : Decimal.mul(res.amount, res.unitPrice);
    const currency = side === "s" ? res.baseCurrency : res.quoteCurrency;
    const userAddress = await this.getAddress();
    const allowance = await this.apiProvider.getAllowance(res.sellTokenAddress, userAddress, this.DEX_CONTRACT);
    if (new Decimal(allowance.toString()).lt(compareAmount)) {
      this.core.run("notify", "warning", "Insufficient allowance", { save: true });
      await this.approve(currency);
      // TODO: throw the error and catch the correct error message to start approving procedure
      // throw new Error("Insufficient allowance");
    }
    const validUntil = getCurrentValidUntil();
    const ratio = switchRatio(side, res.ratio);
    return {
      ...res,
      validUntil,
      ratio,
    };
  }

  async prepareOrder({ market, amount, price, side, buyTokenAddress, sellTokenAddress, fee, type, validUntil, ratio }) {
    let ratioSellArgument = ratio.sell;
    let ratioBuyArgument = ratio.buy;
    let clientOrderId = Math.floor(Math.random() * 1000000);
    const order = {
      recipient: await this.getAddress(),
      chainId: this.CHAIN_ID,
      clientOrderId,
      validUntil,
      ratioSellArgument,
      ratioBuyArgument,
      sellTokenAddress,
      buyTokenAddress,
      maxFeeRatio: fee * 1000,
    };

    const orderHash = ethers.utils.solidityKeccak256(
      ["uint16", "uint64", "uint64", "uint64", "uint256", "uint256", "address", "address"],
      [
        order.maxFeeRatio,
        order.clientOrderId,
        order.validUntil,
        order.chainId,
        order.ratioSellArgument,
        order.ratioBuyArgument,
        order.sellTokenAddress,
        order.buyTokenAddress,
      ],
    );
    const signature = await this.apiProvider?.signOrder({ orderHash });
    const tx = {
      ...order,
      signature,
    };
    return tx;
  }

  async wrapToken(amount, currency = "WETH") {
    const { decimals, info } = getNetworkCurrency(this.NETWORK, currency);
    await this.apiProvider.wrap(amount, info.contract, decimals);
  }

  async unwrapToken(amount, currency = "WETH") {
    const { decimals, info } = getNetworkCurrency(this.NETWORK, currency);
    await this.apiProvider.unwrap(amount, info.contract, decimals);
  }

  async getEvent(currency = "WETH", eventName, fromBlock = 0, toBlock = "latest") {
    const contractAddr = getNetworkCurrency(this.NETWORK, currency).info.contract;
    if (eventName)
      this.emit("eventLogs", await this.apiProvider?.getEvents(contractAddr, eventName, fromBlock, toBlock));
    else {
      this.EVENTS_NAME.map(async name => {
        this.emit("eventLogs", await this.apiProvider?.getEvents(contractAddr, name, fromBlock, toBlock));
      });
    }
  }

}
