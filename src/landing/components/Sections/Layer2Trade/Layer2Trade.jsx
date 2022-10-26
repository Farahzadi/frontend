import React from 'react';
import Image from 'next/image';
import styles from './Layer2Trade.module.css';
import sampImg from '/public/images/site-samp.svg';

const Layer2Trade = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h1 className={styles.titleXS}>Trade over Layer 2</h1>
        <div className={styles.imgContainer}>
          <Image src={sampImg} width={1000} height={800} alt='' />
        </div>
        <div className={styles.textContainer}>
          <h1 className={styles.title}>Trade over Layer 2</h1>
          <p className={styles.description}>
            To start using Dexpresso, you will first have to connect your Web3
            wallet to our application. You’ll then have to bridge funds over and
            activate your zkSync account, this includes a one-time transaction
            of roughly ~10$. To do so head over to Dexpresso Bridge or zkSync
            bridge.
          </p>
          <button className={styles.tradeBtn} type='button'>
            TRAINING
          </button>
        </div>
      </div>
    </section>
  );
};
export default Layer2Trade;
