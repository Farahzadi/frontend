import React from 'react';
import Image from 'next/image';
import styles from './Feature.module.css';

import fast from "/public/images/fast.svg";
import secure from "/public/images/Secure.svg";
import layer2 from "/public/images/Layer2.svg";

const FeatureSection = () => {
  const features = [
    {
      id: '1',
      title: 'Fast',
      description: `Dexpresso orderbooks are managed completely off-chain, while keeping the process trustless.
        This provides users with an instant order-matching in a blink of an eye.`,
      img: fast,
    },
    {
      id: '2',
      title: 'Secure',
      description: `Users do not need to transfer their assets to any entity on-chain for order submission.
        Therefore, the security of user assets are not compromised, while using Dexpresso.`,
      img: secure,
    },
    {
      id: '3',
      title: 'Layer 2 Support',
      description: `Dexpresso supports multiple Ethereum layer 2 blockchains, including zkSync v1 & v2, Arbitrum, Optimism, etc.
        Such blockchains offer users with lower fees and ultra-fast transactions.`,
      img: layer2,
    },
    {
      id: '4',
      title: 'Multi-chain',
      description: `Dexpresso supports a wide range of blockchains with different pairs to provide users with more options for
        interactions with their platforms of interest.`,
      img: layer2,
    },
    {
      id: '5',
      title: 'Zero-knowledge',
      description: `Dexpresso v2 contracts are developed based on zero-knowledge proofs (ZKPs) to further decrease user-side fees
        and improve users privacy.`,
      img: layer2,
    },
  ];
  return (
    <section>
      <div className={styles.title}>
        <h1 className='title'>Why Dexpresso?</h1>
        <p className='subtitle'>Dexpresso offers ...</p>
      </div>
      <div className={styles.cardsContainer}>
        {features.map((val) => (
          <div key={val.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <Image src={val.img} width={80} height={80} alt={val.title} />
              <h2>{val.title}</h2>
            </div>
            <div className={styles.cardBody}>
                <h2>{val.title}</h2>
                <p className={styles.description}>{val.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
export default FeatureSection;
