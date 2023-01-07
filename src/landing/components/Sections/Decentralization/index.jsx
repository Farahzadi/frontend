import React from 'react';
import Image from 'next/image';
import styles from './index.module.css';

import moon from '/public/images/Ellipse-Green.svg';
import planet from '/public/images/Ellipse.svg';
import Decenteral_bg from '/public/images/Decenteral-matters-bg.png';

const Decentralization = () => {
    return (
        <section className={styles.section}>
          <div className={styles.container}>
              <div className={styles.imgContainer}>
                <Image src={Decenteral_bg} width={300} height={542} alt="" />
              </div>
              {/* <div className={styles.bulbImgContainer}>
                  <Image src={moon} height={34} width={34} alt="" />
                  <Image src={planet} height={110} width={148} alt="" />
              </div> */}
              <div className={styles.txtBody}>

                <h1>Best of Both Worlds! </h1>
                <p>
                  Trustless off-chain orderbooks offer users with a centralized-level order matching speed, 
                  while their assets are kept freely in user wallets. Users do not need to complete any KYC
                  process to enjoy seamless trading in multi-chain markets of Dexpresso. On the other hand, 
                  unlike most DEX platforms, the off-chain orderbook method allows users to place unlimitted/simultaneous 
                  and free-of-charge orders in multiple markets and blockchains.
                </p>
              </div>
          </div>
        </section>
    )
}
export default Decentralization;