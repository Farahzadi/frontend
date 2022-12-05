import React, { useEffect, useState } from 'react';
import styles from './Users.module.css';
import CountUp from 'react-countup';

const Trades = ({trades}) => {
  const [rendered, hasRendered] = useState(false);
  let tradeVolumeTotal = 0;
  let tradesCountsTotal = 0;
  let openInterestsTotal = 0;
  trades?.forEach(({tradingCount,  tradingVolumes, openInterest}) => {
    tradeVolumeTotal += tradingVolumes;
    tradesCountsTotal += tradingCount;
    openInterestsTotal += openInterest;
  });
  const getStartPoint = (val) => {
    const len = val?.toString().length;
    if (len > 8) {
      return 9000000;
    } else if (len >= 6) {
      return 90000;
    } else if (len > 4) {
      return 500;
    } else if (len > 2) {
      return 50;
    }
    return 0;

  }
  useEffect(() => {
    if (!rendered) {
      hasRendered(true);
    }
  }, [rendered]);
  if (!rendered) {
    return null;
  }
  return (
    <section className={styles.container}>
      <div className={styles.title}>
        <h1>Backed-up by over 30,000,000 Users</h1>
      </div>
      <div className={styles.mainBody}>
        <div className={styles.item}>
          <h3>trading volume</h3>
          <CountUp
            start={getStartPoint(tradeVolumeTotal)}
            end={tradeVolumeTotal}
            duration={20}
            enableScrollSpy={true}
            scrollSpyOnce={true}
            separator=','
            prefix='$'
          />
          <p>last 24 hr</p>
        </div>
        <div className={styles.item}>
          <h3>trades</h3>
          <CountUp
            start={getStartPoint(tradesCountsTotal)}
            end={tradesCountsTotal}
            duration={30}
            enableScrollSpy
            scrollSpyOnce
            separator=','
          />
          <p>last 24 hr</p>
        </div>
        <div className={styles.item}>
          <h3>open interest</h3>
          <CountUp
            start={getStartPoint(openInterestsTotal)}
            end={openInterestsTotal}
            duration={20}
            enableScrollSpy
            scrollSpyOnce
            separator=','
            prefix='$'
          />
          <p>last 24 hr</p>
        </div>
      </div>
    </section>
  );
};
export default Trades;
