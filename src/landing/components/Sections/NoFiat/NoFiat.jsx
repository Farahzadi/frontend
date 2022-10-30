import React, { PureComponent } from 'react';
import Image from 'next/image';
import styles from './NoFiat.module.css';
import no_more_fiat from '/public/images/No-more-fiat.svg';

const NoFiat = () => {
  const benefits = [
    {
      id: 1,
      title: 'Low fees, no gas costs',
      description: `Once you deposit to Layer 2, you will no longer pay fees
        to miners for each transaction.`,
    },
    {
      id: 2,
      title: 'Lightning quick',
      description: ` Trades are executed instantly and confirmed on the
        blockchain within hours.`,
    },
    {
      id: 3,
      title: 'Fast withdrawals',
      description: `Unlike other platforms, there is no wait required to
        withdraw your funds from Layer 2.`,
    },
    {
      id: 4,
      title: 'Secure & private',
      description: `StarkWare's Layer 2 solution provides increased security &
        privacy via zero-knowledge rollups.`,
    },
    {
      id: 5,
      title: 'Cross-margining',
      description: `Access leverage across positions in multiple markets from
        a single account.`,
    },
    {
      id: 6,
      title: 'Mobile friendly',
      description: ` We've redesigned our exchange from the ground up, so you
        can use it from any device.`,
    },
  ];
  return (
    <section>
      <div className={styles.title}>
        <h1>Wait is over, No more fiat</h1>
        <p>No need to trust anyone here . . . </p>
      </div>
      <div className={styles.mainContainer}>
        {benefits.map((val, index) => (
          <div
            key={val.id}
            className={`nofiat-item ${styles.item}`}
            // style={{
            //   gridRow: `${(index % 3)  +1} / span 1`,
            //   gridColumn: `${(index % 2) + 1} / span 1`,
            // }}
          >
            <style jsx>
              {`
                .nofiat-item {
                  grid-row: ${index + 1} / span 1;
                  grid-column: 1 / span 1;
                }
                @media (min-width: 428px) {
                  .nofiat-item {
                    grid-row: ${(index % 3) + 1} / span 1;
                    grid-column: ${(index % 2) + 1} / span 1;
                  }
                }
              `}
            </style>

            <div className={styles.itemBody}>
              <div className={styles.imgContainer}>
                <Image
                  src={no_more_fiat}
                  width={67}
                  height={67}
                  alt='no more fiat'
                />
              </div>
              <div className={styles.itemText}>
                <h2>{val.title}</h2>
                <p>{val.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
export default NoFiat;
