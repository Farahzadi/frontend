import React from 'react';
import Image from 'next/image';
import styles from './Guide.module.css';

const GuideSection = () => {
  const steps = [
    {
      id: 1,
      title: 'FIRST STEP',
      description: 'First step goes here, first step goes here',
    },
    {
      id: 2,
      title: 'SECOND STEP',
      description: 'Second step goes here, second step goes here',
    },
    {
      id: 3,
      title: 'THIRD STEP',
      description: 'Third step goes here, Third step goes here',
    },
  ];
  return (
    <section className={styles.container}>
      <div className={styles.title}>
        <h1 className='title'>HOW TO USE DEXPRESSO?</h1>
        <p className='subtitle'>So simple to use</p>
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
