import React from 'react';
import Image from 'next/image';
import styles from './Guide.module.css';

const GuideSection = () => {
  const steps = [
    {
      id: 1,
      title: 'Connect Wallet',
      description: 'Use any non-custodial wallet to interact with Dexpresso.',
    },
    {
      id: 2,
      title: 'Submit Order',
      description: 'Sign the off-chain order with your wallet.',
    },
    {
      id: 3,
      title: 'Drink Coffee',
      description: 'Enjoy your coffee and whatch the orderbook.',
    },
  ];
  return (
    <section className={styles.container}>
      <div className={styles.title}>
        <h1 className='title'>How to Use Dexpresso?</h1>
        <p className='subtitle'>As easy and making a coffee and enjoying it . . .</p>
      </div>
      <div className={styles.cardsContainer}>
        {steps.map((val) => (
          <div key={val.id} className={styles.cardBG}>
            <div  className={styles.card}>
              <h2>{val.title}</h2>
              <p>{val.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
export default GuideSection;
