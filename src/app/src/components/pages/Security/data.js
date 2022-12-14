export const ALLOWANCE_INFO = `Security of private key:
This is the same scenario as user’s private key security in any other layer 1 or layer 2 blockchains. We highly advise users to keep their assets only using non-custodial wallets. For additional security, hardware wallets, such as Ledger and Trezor, are also welcome that are compatible with multiple desktop wallets, such as Metamask.

Security of previously submitted orders:
When a zkSync Limit order is signed by user, theoretically it can be used as long as user increases the account nonce by a transaction in zkSync network (i.e. transfer). Although Dexpresso ensures that open order limits submitted by users are only used as as long as user requested (by specifying the amount), users can increase their account’s nonce (provided by button below) to invalidate all previously open limit order in the entire zkSync’s network. However, users should note that all of their limit orders in all of the markets of zkSync’s network will be canceled by this action. A better way to mange multiple orders and ensuring the security of them over zkSync network is to handle orders of each market with its unique trade account as suggested by zkSync itself.

Employing Trade accounts:
A trading account is an ordinary account that can be used to sign a limit order. It's function is to limit the amount of a certain token that a user wants to exchange. To do this, user has to:

Transfer the desired amount of a desired token to a new account.
Set a signing key for the account.
Sign a limit order.
This way the limit order will exchange at most the amount you transferred to the trading account. Remaining balance on the main account will be left untouched.`;
