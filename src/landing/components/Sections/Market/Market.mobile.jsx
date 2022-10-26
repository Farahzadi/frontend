import React, { useState, useEffect } from 'react';
import AnyDest from './AnyDest';
import styles from './Market.module.css';
import MultiChainWallet from './MultiChainWallet';
import XChain from './XChain';
const Market = () => {
  const markets = [
    { id: 1, name: 'Any destination', comp: AnyDest },
    { id: 2, name: 'Multi-Chain wallet', comp: MultiChainWallet },
    { id: 3, name: 'X-Chain solution', comp: XChain },
  ];
  const [selectedTab, setSelectedTab] = useState(null);

  return (
    <section className={styles.marketXS}>
      <div className={styles.containerXS}>
        {markets.map((val) => (
          <div key={val.id} className={`${styles.itemXS} `}>
            <div className={`${styles.ItemHeader} `}>
              <button
                key={val.id}
                className={`${styles.marketBtnXS} ${
                  selectedTab === val.id && styles.selectedTab
                } `}
                onClick={() => {
                  setSelectedTab(val.id);
                }}
              >
                {val.name}{' '}
              </button>
            </div>
            <div className={`${styles.mainContainerXS} card-gradient-border`}>
              <val.comp key={val.id} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Market;
