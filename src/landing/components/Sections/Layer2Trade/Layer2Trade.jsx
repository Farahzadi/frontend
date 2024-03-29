import React from 'react';
import Image from 'next/image';
import styles from './Layer2Trade.module.css';
import sampImg from '/public/images/site-samp.svg';
import Link from 'next/link';
import { getDocsLink, getTradeLink } from '../../../utils/env';

const Layer2Trade = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h1 className={styles.titleXS}>Trade over Layer 2</h1>
        <div className={styles.imgContainer}>
          <Image src={sampImg} width={600} height={500} alt='' />
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
          <Link href={getDocsLink()}>
            <button className={styles.tradeBtn} type='button'>
              TRAINING
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};
export default Layer2Trade;
