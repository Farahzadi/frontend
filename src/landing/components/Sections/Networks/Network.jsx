import Image from 'next/image';
import React from 'react';
import styles from './Network.module.css';
import ZKSYNC_LOGO from '../../../public/images/zksync-logo-full.svg';
const Networks = ({ networks }) => {
  const fixNetName = (val) => {
    if (val) {
      return val.replace('_', ' ');
    }
    return val;
  };
  return (
    <section className={styles.section}>
      <h1 className='title'>Supported Blockchains</h1>
      <p className='subtitle'>Dexpresso aims to provide a unique and seamless experience for users over multiple blockchains</p>
      <div className={styles.mainContainer}>
        {networks?.map((val) => (
          <div className={styles.netItem} key={val.network}>
            <div className={styles.logo}>
              {
                <Image
                    height={32}
                    width={80}
                  src={val.icon ? val.icon : ZKSYNC_LOGO}
                  alt={val.network}
                />
              }
            </div>
            <div className={styles.netName}>{fixNetName(val.network)}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
export default Networks;
