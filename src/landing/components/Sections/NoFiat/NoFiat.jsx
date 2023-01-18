import React, { PureComponent } from 'react';
import Image from 'next/image';
import styles from './NoFiat.module.css';
import no_more_fiat from '/public/images/No-more-fiat_2.svg';

const NoFiat = () => {
  const benefits = [
    {
      id: 1,
      title: 'Low fees',
      description: `The wide range of supported networks gives user more options to trade 
        their desired assets in the optimal network to decrease their fee rates.`,
      img: 'square-low-fee.svg'
    },
    {
      id: 2,
      title: 'Lightning quick',
      description: `Orders are matched instantly (off-chain) and confirmed on-chain to keep up
        the orderbook speed, while providing a trustless trading platform for users.`,
      img: 'square-fast.svg'
    },
    {
      id: 3,
      title: 'Multiple Blockchain Support',
      description: `The wide range of supported networks gives user more options to trade 
      their desired assets in the optimal network to decrease their fee rates.`,
      img: 'square-multi-chain.svg'
    },
    {
      id: 4,
      title: 'Secure & private',
      description: `StarkWare's Layer 2 solution provides increased security &
        privacy via zero-knowledge rollups.`,
      img: 'square-trustless.svg'
    },
    {
      id: 5,
      title: 'Cross-margining',
      description: `Access leverage across positions in multiple markets from
        a single account.`,
      img: 'square-secure.svg'
    },
    {
      id: 6,
      title: 'Mobile friendly',
      description: ` We've redesigned our exchange from the ground up, so you
        can use it from any device.`,
      img: 'square-orderbook.svg'
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
                  src={`/images/${val.img}`}
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
