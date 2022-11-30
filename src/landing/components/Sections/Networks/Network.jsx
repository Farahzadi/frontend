import React from 'react';
import styles from './Network.module.css';
const Networks = ({networks}) => {
    const fixNetName = (val) => {
        if (val) {
            return val.replace('_', ' ')
        }
        return val;
    }
    return (
        <section className={styles.section}>
            <h1 className='title'>Networks</h1>
            <p className='subtitle'>We work on different networks</p>
            <div className={styles.mainContainer}>
                {networks.map(val => <div className={styles.netItem} key={val.network}>{fixNetName(val.network)}</div>)}
            </div>

        </section>
    )
}
export default Networks;