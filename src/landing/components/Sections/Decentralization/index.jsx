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
              <div className={styles.bulbImgContainer}>
                  <Image src={moon} height={34} width={34} alt="" />
                  <Image src={planet} height={110} width={148} alt="" />
                </div>
              <div className={styles.txtBody}>

                <h1>Decentralization, matters! </h1>
                <p>
                  Dexpresso is a decentralized non-custodial order book exchange,
                  powered by zk-rollups. This allows our users to seamlessly and
                  securely trade with near-zero fees all while providing
                  centralized exchange like quotes on all size trades. We also
                  aim to provide the flawless functionality, experience and
                  optimal liquidity centralized exchanges do all while being
                  fully decentralized.
                </p>
              </div>
          </div>
        </section>
    )
}
export default Decentralization;