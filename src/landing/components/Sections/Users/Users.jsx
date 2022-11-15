import React, { useEffect, useState } from 'react';
import styles from './Users.module.css';
import CountUp from 'react-countup';

const Users = () => {
  const [rendered, hasRendered] = useState(false);
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
            start={100000}
            end={800000000}
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
            start={1000}
            end={200000}
            duration={20}
            enableScrollSpy
            scrollSpyOnce
            separator=','
          />
          <p>last 24 hr</p>
        </div>
        <div className={styles.item}>
          <h3>open interest</h3>
          <CountUp
            start={100000}
            end={600000000}
            duration={20}
            enableScrollSpy
            scrollSpyOnce
            separator=','
            prefix='$'
          />
          {/* <h1>$600,000,000</h1> */}
          <p>last 24 hr</p>
        </div>
      </div>
    </section>
  );
};
export default Users;
