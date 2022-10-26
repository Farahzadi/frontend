import React, { useState, useEffect } from 'react';
import AnyDest from './AnyDest';
import styles from './Market.module.css';
import MultiChainWallet from './MultiChainWallet';
import XChain from './XChain';
const Market = () => {
  const markets = [
    { id: 1, name: 'Any destination', comp: AnyDest},
    { id: 2, name: 'Multi-Chain wallet', comp: MultiChainWallet },
    { id: 3, name: 'X-Chain solution', comp: XChain },
  ];
  const [selectedTab, setSelectedTab] = useState(1);

  return (
    <section className={styles.market}>

      <div className={styles.marketTabs}>
        {markets.map((val) => (
          <button key={val.id}
            className={selectedTab === val.id ? `${styles.selectedTab} ${styles.marketBtn}` : styles.marketBtn}
            onClick={() => {
              setSelectedTab(val.id);
            }}
          >
            {val.name}{' '}
          </button>
        ))}
      </div>
      <div className={styles.marketBox}>
        <div className={styles.mainContent}>
        {markets.map((val) => (
            val.id === selectedTab && <val.comp key={val.id} />
        ))}


        </div>
      </div>
    </section>
  );
};

export default Market;
