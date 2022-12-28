import { formatBalances, fromBaseUnit, toBaseUnit } from "lib/utils";
import ZKSyncAPIProvider from "../providers/ZKSyncAPIProvider";
import { ethers } from "ethers";
import EthereumInterface from "./EthereumInterface";
import { SecurityComp } from "components/pages/Security/types";
import Decimal from "decimal.js";
import NetworkInterface from "./NetworkInterface";
import * as zksync from "zksync";
import Currencies, { getNetworkCurrency } from "config/Currencies";
import { maxAllowance } from "../constants";

export default class ZKSyncInterface extends EthereumInterface {
  static Actions = [
    ...super.Actions,
    "increaseNonce",
    "changePubKeyFee",
    "depositL2",
    "withdrawL2",
    "withdrawL2Fee",
    "depositL2Fee",
    "approveL1"
  ];

  static Provider = ZKSyncAPIProvider;
  NETWORK = "zksyncv1";
  HAS_CONTRACT = false;
  HAS_BRIDGE = true;
  BRIDGE_CONTRACT = "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF";
  SECURITY_TYPE = SecurityComp.Nonce;

  ETHERSCAN_URL = "https://etherscan.io";
  ZKSCAN_URL = "https://zkscan.io";

  async signIn() {
    await super.signIn(false);
    await this.updateUserState(true);
    this.state.set(NetworkInterface.State.SIGNED_IN);
    if (this.shouldSignOut) this.signOut();
  }

  async increaseNonce() {
    let increaseNonceResult = {};

    const increaseNonceRes = await this.apiProvider.increaseWalletNonce();
    // cancel all orders if wallet nonce is increased
    this.core.cancelAllOrders();
    const verifiedAccountNonce = await this._accountState.verified.nonce;
    if (increaseNonceRes) {
      increaseNonceResult.response = increaseNonceRes;
      increaseNonceResult.verifiedAccountNonce = verifiedAccountNonce;
    }

    return increaseNonceResult;
  }

  async fetchL1Balances() {
    return await super.fetchBalances();
  }

  async fetchAllowances() {
    return await super.fetchAllowances(true);
  }

  async fetchL1Allowances() {
    return await super.fetchAllowances(false);
  }

  async approve(ticker, allowance = maxAllowance) {
    return await super.approve(ticker, allowance, true);
  }

  async approveL1(ticker, allowance = maxAllowance) {
    return await super.approve(ticker, allowance, false);
  }

  formatZkSyncBalances(balances) {
    const entries = Object.entries(balances)
      .map(([ticker, currency]) => [ticker.toUpperCase(), currency])
      .filter(([ticker, currency]) => getNetworkCurrency(this.NETWORK, ticker));
    return Object.fromEntries(entries);
  }

  async updateAddress(_accountState) {
    if (_accountState) {
      this.userDetails.address = ethers.utils.getAddress(_accountState.address);
      return;
    }
    if (!this.apiProvider) return;
    const address = await this.apiProvider.getAddress();
    this.userDetails.address = address;
  }

  async updateNonce(_accountState) {
    if (_accountState) {
      this.userDetails.nonce = +_accountState.committed.nonce;
      return;
    }
    if (!this.apiProvider) return;
    const nonce = await this.apiProvider.getNonce();
    this.userDetails.nonce = nonce;
  }

  async updatePureBalances(_accountState) {
    if (!_accountState && !this.apiProvider) return;
    const accountState = _accountState ?? (await this.apiProvider.getAccountState());
    const zkBalances = this.formatZkSyncBalances(accountState.committed.balances);
    this.userDetails.balances = formatBalances(zkBalances, Currencies);
  }

  async updateChainDetails(_accountState) {
    if (!this.apiProvider) return;
    const accountStatePromise = (async () =>
      _accountState ?? (await this.apiProvider.getAccountState()))();
    const balancesPromise = this.fetchL1Balances();
    const allowancesPromise = this.fetchL1Allowances();
    const [accountState, l1Balances, allowances] = await Promise.all([
      accountStatePromise,
      balancesPromise,
      allowancesPromise
    ]);
    const verifiedZkBalances = this.formatZkSyncBalances(accountState.verified.balances);
    this.userDetails.chainDetails = {
      verified: {
        nonce: +accountState.verified.nonce,
        balances: formatBalances(verifiedZkBalances, Currencies)
      },
      userId: accountState.id,
      L1Balances: formatBalances(l1Balances, Currencies),
      allowances: formatBalances(allowances, Currencies)
    };
  }

  async updateUserDetails() {
    const accountState = await this.fetchAccountState();
    await super.updateUserDetails(accountState);
  }

  async fetchAccountState() {
    // if(![NetworkInterface.State.PROVIDER_CONNECTED, NetworkInterface.State.SIGNED_IN, NetworkInterface.State.SIGNING_IN
    //   NetworkInterface.State.].includes(this.state.get()))
    if (!this.apiProvider) return {};
    return await this.apiProvider.getAccountState();
  }

  getZKRatio(price, market) {
    const ratio = this.getRatio(price);
    const [baseCurrency, quoteCurrency] = market.split("-");
    return {
      [baseCurrency]: ratio.base,
      [quoteCurrency]: ratio.quote
    };
  }

  async validateOrder({ market, price, amount, side, fee, type }) {
    const res = await NetworkInterface.prototype.validateOrder.call(this, {
      market,
      price,
      amount,
      side,
      fee,
      type
    });
    const buyPrice = Decimal.mul(res.price, Decimal.add(1, res.fee)).toFixed();
    const sellPrice = Decimal.mul(res.price, Decimal.sub(1, res.fee)).toFixed();

    const priceWithFee = res.side === "b" ? buyPrice : sellPrice;
    const ratio = zksync.utils.tokenRatio(this.getZKRatio(priceWithFee, res.market));

    return {
      ...res,
      ratio
    };
  }

  async prepareOrder({
    market,
    amount,
    price,
    side,
    buyTokenAddress,
    sellTokenAddress,
    fee,
    type,
    validUntil,
    ratio
  }) {
    const [baseCurrency, quoteCurrency] = market.split("-");
    const [buyCurrency, sellCurrency] =
      side === "b" ? [baseCurrency, quoteCurrency] : [quoteCurrency, baseCurrency];
    const tx = await this.apiProvider?.signOrder({
      sellCurrency,
      buyCurrency,
      ratio,
      validUntil
    });
    return tx;
  }

  async bridgeTransferL2(amount, token, type) {
    if (!amount || !type || !["deposit", "withdraw"].includes(type)) return;
    const address = await this.getAddress();
    const userId = (await this.getChainDetails())?.userId;
    if (!address || !userId) return;
    const decimals = Currencies[token].decimals;
    amount = ethers.BigNumber.from(toBaseUnit(amount, decimals));

    const transfer = await this.apiProvider?.[type === "deposit" ? "depositL2" : "withdrawL2"](
      amount,
      address,
      token
    );

    const receipt = await this.apiProvider?.getBridgeReceiptStatus(transfer, type);
    const readableAmount = fromBaseUnit(amount.toString(), decimals);

    this.emit(
      "bridgeReceipt",
      this.handleBridgeReceipt(
        transfer,
        readableAmount,
        token,
        type,
        userId,
        address,
        receipt?.status
      )
    );
    return transfer;
  }

  async depositL2(amount, token) {
    return await this.bridgeTransferL2(amount, token, "deposit");
  }

  async withdrawL2(amount, token) {
    return await this.bridgeTransferL2(amount, token, "withdraw");
  }

  async depositL2Fee(token) {
    return this.apiProvider?.depositL2Fee(token);
  }

  async withdrawL2Fee(token) {
    return this.apiProvider?.withdrawL2Fee(token);
  }

  handleBridgeReceipt(_receipt, amount, token, type, userId, userAddress, status) {
    let receipt = {
      date: +new Date(),
      network: this.network,
      amount,
      token,
      type,
      userId,
      userAddress,
      _receipt,
      status
    };
    if (!_receipt) {
      return receipt;
    }
    if (_receipt.ethTx) {
      receipt.txId = _receipt.ethTx.hash;
      receipt.txUrl = `${this.ETHERSCAN_URL}/tx/${receipt.txId}`;
    } else if (_receipt.txHash) {
      receipt.txId = _receipt.txHash.split(":")[1];
      receipt.txUrl = `${this.ZKSCAN_URL}/explorer/transactions/${receipt.txId}`;
    }

    return receipt;
  }

  async changePubKeyFee() {
    return await this.apiProvider?.changePubKeyFee();
  }
}
