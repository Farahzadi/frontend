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
      description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit,
        sed do eiusmod tempor incididunt ut labore et dolore magna
        aliqua.`,
      img: fast,
    },
    {
      id: '2',
      title: 'Secure',
      description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit,
        sed do eiusmod tempor incididunt ut labore et dolore magna
        aliqua.`,
      img: secure,
    },
    {
      id: '3',
      title: 'Layer 2',
      description: ` Lorem ipsum dolor sit amet, consectetur adipiscing elit,
        sed do eiusmod tempor incididunt ut labore et dolore magna
        aliqua.`,
      img: layer2,
    },
  ];
  return (
    <section>
      <div className={styles.title}>
        <h1 className='title'>WHY DEXPRESSO?</h1>
        <p className='subtitle'>we offer...</p>
      </div>
      <div className={styles.cardsContainer}>
        {features.map((val) => (
          <div key={val.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <Image src={val.img} width={80} height={80} alt='' />
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
