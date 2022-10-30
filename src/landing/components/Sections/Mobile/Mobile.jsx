import Image from 'next/image';
import React from 'react';
import mobile from '../../../public/images/mobile-app.png';
import desktop from '../../../public/images/landing-laptop-mockup.png';
import styles from './Mobile.module.css';
const Mobile = () => {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.mobile}>
                    <Image className={styles.mobileImg} src={mobile} alt="mobile" width={'170px'} height={'400px'} />

                </div>
                <div className={styles.desktop}>
                    <Image src={desktop} alt="desktop" width={'450px'} height={'260px'} />
                </div>
                <h1 className={styles.text}>
                    Enjoy <br />
                    Trading <br />
                    On Your Phone
                </h1>
            </div>
        </section>
    )
}
export default Mobile;