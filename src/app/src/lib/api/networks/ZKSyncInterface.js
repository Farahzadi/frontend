import { formatBalances } from "lib/utils";
import ZKSyncAPIProvider from "../providers/ZKSyncAPIProvider";
import { ethers } from "ethers";
import EthereumInterface from "./EthereumInterface";
import { SecurityComp } from "components/pages/Security/types";
import Decimal from "decimal.js";
import NetworkInterface from "./NetworkInterface";
import * as zksync from "zksync";

export default class ZKSyncInterface extends EthereumInterface {
  static Actions = [...super.Actions, "increaseNonce", "approve"];

  static Provider = ZKSyncAPIProvider;
  NETWORK = "zksyncv1";
  HAS_BRIDGE = true;
  BRIDGE_CONTRACT = "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF";
  SECURITY_TYPE = SecurityComp.Nonce;

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

  async approveL1(ticker, allowance, isLayerTwo) {
    return await super.approve(ticker, allowance, false);
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
      this.userDetails.nonce = +_accountState.verified.nonce;
      return;
    }
    if (!this.apiProvider) return;
    const nonce = await this.apiProvider.getNonce();
    this.userDetails.nonce = nonce;
  }

  async updateBalances(_accountState) {
    if (!_accountState && !this.apiProvider) return;
    const accountState =
      _accountState ?? (await this.apiProvider.getAccountState());
    this.userDetails.balances = formatBalances(
      accountState.verified.balances,
      this.core.currencies
    );
  }

  async updateChainDetails(_accountState) {
    if (!this.apiProvider) return;
    const accountStatePromise = (async () => {
      _accountState ?? (await this.apiProvider.getAccountState());
    })();
    const balancesPromise = this.fetchL1Balances();
    const allowancesPromise = this.fetchL1Allowances();
    const [accountState, l1Balances, allowances] = await Promise.all([
      accountStatePromise,
      balancesPromise,
      allowancesPromise,
    ]);
    this.userDetails.chainDetails = {
      committed: {
        nonce: +accountState.committed.nonce,
        balances: formatBalances(
          accountState.committed.balances,
          this.core.currencies
        ),
      },
      userId: accountState.id,
      L1Balances: l1Balances,
      allowances: allowances,
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

  getTokenRatio(market, baseRatio, quoteRatio) {
    const [baseCurrency, quoteCurrency] = market.split("-");
    return {
      [baseCurrency]: baseRatio,
      [quoteCurrency]: quoteRatio,
    };
  }

  async validateOrder({ market, price, amount, side, fee, type }) {
    const res = await NetworkInterface.prototype.validateOrder.call(this, {
      market,
      price,
      amount,
      side,
      fee,
      type,
    });

    const buyPrice = Decimal.mul(res.price, Decimal.add(1, res.fee)).toFixed();
    const sellPrice = Decimal.mul(res.price, Decimal.sub(1, res.fee)).toFixed();

    const priceWithFee = res.side === "b" ? buyPrice : sellPrice;
    const ratio = zksync.utils.tokenRatio(
      this.getTokenRatio(res.market, 1, priceWithFee)
    );

    return {
      ...res,
      ratio,
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
    ratio,
  }) {
    const [baseCurrency, quoteCurrency] = market.split("-");
    const [buyCurrency, sellCurrency] =
      side === "b"
        ? [baseCurrency, quoteCurrency]
        : [quoteCurrency, baseCurrency];

    const tx = await this.apiProvider?.signOrder({
      sellCurrency,
      buyCurrency,
      ratio,
      validUntil,
    });
    return tx;
  }

  async depositL2(amount, token) {
    return this.apiProvider.depositL2(amount, token);
  }

  async withdrawL2(amount, token) {
    return this.apiProvider.withdrawL2(amount, token);
  }

  async depositL2Fee(token) {
    return this.apiProvider.depositL2Fee(token);
  }

  async withdrawL2Fee(token) {
    return this.apiProvider.withdrawL2Fee(token);
  }
}
