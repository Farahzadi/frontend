import { getENSName } from "lib/ens";
import { formatBalances } from "lib/utils";
import erc20ContractABI from "lib/contracts/ERC20.json";
import { maxAllowance } from "../constants";
import ZKSyncAPIProvider from "../providers/ZKSyncAPIProvider";
import NetworkInterface from "./NetworkInterface";
import { ethers } from "ethers";

export default class ZKSyncInterface extends NetworkInterface {
  static Actions = [...super.Actions, "increaseNonce", "approve"];

  static Provider = ZKSyncAPIProvider;
  NETWORK = "zksyncv1";
  hasBridge = true;
  BRIDGE_CONTRACT = "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF";

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

  async getL1Balances() {
    if (!this.apiProvider) return null;

    const getBalance = async (ticker) => {
      const balance = await this.apiProvider?.getBalanceOfCurrency(
        ticker,
        erc20ContractABI,
        maxAllowance
      );
      return { [ticker]: balance };
    };

    const currencies = this.core.currencies;

    let results = await Promise.all(
      Object.keys(currencies)
        .filter((ticker) => currencies[ticker]?.chain?.[this.NETWORK])
        .map((ticker) => getBalance(ticker))
    );
    const balances = results.reduce((prev, curr) => ({ ...prev, ...curr }), {});
    return balances;
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
    const balancesPromise = this.getL1Balances();
    const allowancesPromise = this.getAllowances();
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
    const accountState = await this.getAccountState();
    await super.updateUserDetails(accountState);
  }

  async getProfileName(address) {
    const res = await super.getProfileName(address);
    return (await this.fetchENSName(this.userDetails.address)) ?? res;
  }

  async fetchENSName(address) {
    try {
      return await getENSName(address);
    } catch (err) {
      console.log(`ENS error: ${err}`);
      return null;
    }
  }

  async approve(currency, allowance = maxAllowance) {
    return await this.apiProvider?.approve(
      currency,
      allowance || maxAllowance,
      erc20ContractABI
    );
  }

  async getAccountState() {
    // if(![NetworkInterface.State.PROVIDER_CONNECTED, NetworkInterface.State.SIGNED_IN, NetworkInterface.State.SIGNING_IN
    //   NetworkInterface.State.].includes(this.state.get()))
    if (!this.apiProvider) return {};
    return await this.apiProvider.getAccountState();
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

  async getCommitedBalance() {
    const commitedBalance = this.apiProvider.getCommitedBalance();
    if (commitedBalance) {
      return commitedBalance;
    } else {
      return 0;
    }
  }
}
