import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import styles from './Intro.module.css';

import backgroundImg from '/public/images/landing-logo.png';
import logo from '/public/images/Logo.svg';
import ClientPortal from '../../ClientPortal/ClientPortal';
const IntroSection = () => {
  return (
    <section className={styles.container}>
      <div className={styles.headerText}>
        <div className={styles.logoContainer}>
          <Image src={logo} height={150} width={320} alt='Logo' />
        </div>
        <h1 className={styles.title}>
          Decentralized & Secure,
          <br />
          On Layer Two Networks
        </h1>
        <p className={styles.description}>
          Enjoy Centralized-level speed in a Decentralized Exchange, with Lower
          fees.
        </p>
      </div>
      <div className={styles.background}>
        <Image
          src={backgroundImg}
          layout={'responsive'}
          width={800}
          height={570}
          alt='3D-logo'
        />
      </div>
      <ClientPortal selector={'__next'}>
        <button type='button' className={styles.tradeBtn}>
          START TRADING
        </button>
      </ClientPortal>
    </section>
  );
};
export default IntroSection;
