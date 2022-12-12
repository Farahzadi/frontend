import EthAPIProvider from "../providers/EthAPIProvider";
import NetworkInterface from "./NetworkInterface";

export default class EthereumInterface extends NetworkInterface {
  static Provider = EthAPIProvider;
  NETWORK = "ethereum";
  CURRENCY = "ETH";

  async updateBalances() {
    if (!this.apiProvider) return;
    const address = await this.apiProvider.getAddress();
    const currencies = this.core.getNetworkCurrencies(this.NETWORK);
    const entriesPromises = Object.entries(currencies).map(
      async ([ticker, currency]) => {
        let balance;
        if (ticker === this.CURRENCY)
          balance = await this.apiProvider.getBalance(address);
        else
          balance = await this.apiProvider.getTokenBalance(
            currency.info.contract,
            address
          );
        return [ticker, balance.toString()];
      }
    );
    const entries = await Promise.all(entriesPromises);
    const balances = Object.fromEntries(entries);
    this.userDetails.balances = formatBalances(balances, currencies);
  }
}
