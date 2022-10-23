import zksyncLogo from "../../../../assets/images/ZkSync.svg";
import ethLogo from "../../../../assets/images/currency/ETH.svg";

export const networks = [
    {
      from: {
        network: 'Ethereum',
        key: 'ethereum',
        icon: ethLogo,
      }, to: [{ network: 'zkSync', key: 'zksync', icon: zksyncLogo }]
    },
    {
      from: {
        network: 'zkSync',
        key: 'zksync',
        icon: zksyncLogo
      }, to: [{ network: 'Ethereum', key: 'ethereum', icon: ethLogo }]
    }
  ];