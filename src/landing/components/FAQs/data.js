export const FAQList = [
  {
    question: 'What are Layer 2 Blockchains?',
    answer:
      'Layer2 blockchains are built upon the original Layer 1 blockchains (e.g. Ethereum, Bitcoin, Polygon, . . .) in order to scale-up number of transactions and/or functionality of Layer 1.',
  },
  {
    question: 'What is zkSync?',
    answer:
      'zkSync blockchain is one the main of rollup platforms that targets scaling-up Ethereum’s number of transactions per block, while still basing its security and reputation on the underlying Ethereum mainnet blockchain. zkSync’s protocol periodically submits a zkSNARK-based proof (regarding changes in account’s states within its network) to the Ethereum’s mainnet to provide a cost-effective non-custodial account management mechanism for users assets.',
  },
  { question: 'How do zero knowledge rollups work?', answer: '' },
  {
    question: 'Will there be more trading pairs in the future?',
    answer:
      'We try our best to support as many pairs as possible in each chain. However, if a circulating volume in a pair gets lower than certain threshold, its orders are subject to be liquidized unfairly. To this end, we only limit number of pairs by the foreseen circulating volume on a chain. Thus, as soon as a pair of assets reaches a minimum interest rate among users, we will launch its market in the platform.',
  },
  {
    question: 'How do I deposit & withdraw from Layer 2?',
    answer:
      'In order to transfer funds between layer 1 and layer 2 networks, users have to interact with the smart contract of the Layer 2 platform in the layer1 blockchain. For instance, to withdraw/deposit assets from/to zkSync network, users must trigger respected functions of official zkSync’s smart contract on Ethereum mainnet. To make this more convenient for users, zkSync wallet provides this functionality. On the other hand, Dexpresso has also implemented a very user-friendly interface (the “bridge” tool) to ease-up the overall experience for you.',
  },
  {
    question: 'How does Layer 2 impact privacy?',
    answer:
      'Although all layer 2 transactions are kept off-chain and zkSync only publishes balance changes periodically, the trade history (limits and swaps) are available through different APIs that zkSync officially and publicly provides. Therefore, the privacy conditions of users are not changed compared to Ethereum’s mainnet. But it is worth mentioning that the viewable data is not as clear as layer 1 explorers, such as Etherscan, which help preserving more aspects of users privacy.',
  },
  {
    question: 'Which wallets support the zkSync Layer 2 system?',
    answer:
      'Dexpresso platform is implemented with user’s point-of-view in mind. Therefore, it is compatible with the most common non-custodial wallets, such as Metamask that most of DeFi enthusiasts use. On the other hand, it is also compatible with Wallet-Connect protocol that is supported in a wide range of non-custodial wallets, such as Trust-wallet, {wal1}, {wal2}, etc. However, for a seamless and perfect interaction with Dexpresso we advise users to use Metamask, which is completely open-source and community-developed wallet that has been available for a long time on many platforms, including Android and IOS, or as a Browser-Extension on various browsers, such as Chrome and FireFox.',
  },
  {
    question: 'What price oracles does Dexpresso use?',
    answer:
      'In order to ensure accuracy of live prices, Dexpresso uses CCXT protocol to get multiple exact market prices of multiple centralized and decentralized exchanges and combines them to achieve final price.',
  },
  {
    question: 'How will Layer 1 and Layer 2 interact?',
    answer:
      'zkSync’s protocol periodically submits a zkSNARK-based proof (regarding changes in account’s states within its network) to the Ethereum’s mainnet to provide a cost-effective non-custodial account management mechanism for users assets.',
  },
  { question: 'Are my funds safe on Layer 2?', answer: '' },
  { question: 'What is the future of decentralized exchange?', answer: '' },
  {
    question: 'The platform does not show my Metamask balance:',
    answer:
      'Dexpresso is a multi-chain platform. If you are using Metamask, make sure that your assets are available in the selected chain in Dexpresso. This may happen especially if you want to trade in a Layer2 chain, such as zkSync V1, that does not show its value on Metamask. When connected to DEX platform, your assets on Layer1 and Layer2 are shown using the wallet balance popup (through clicking on your address in the trading platform).',
  },
  {
    question: 'Platform asks my permission for approval to my wallet:',
    answer: `Permissions through Metamask are handled in a pretty standard manner. At start of each session, we require you to sign a “Login” message that ensures you are owner of the specific address.
    Another scenario, is when you want to transfer tokens from Layer1 to Layer2 chains, such as zkSync by using the bridge tool. The approval is given to the official Layer2’s (i.e zkSync) smart contract on Layer1 (i.e. Ethereum)`,
  },
  { question: 'The ratio or amounts of the requested order differs from what I have asked to for:', answer: 'We handle order-matching fee along with the transaction broadcast fee on the network by additional ratio to the original order of users. This additional ratio is set to {x}% for “maker” orders and {Y}% for “taker” orders' },
];
