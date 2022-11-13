import React from 'react';
import { FAQList } from './data';
import styles from './FAQs.module.css';
const FAQs = () => {
  const [expandedId, setExpandedId] = React.useState(null);
  const toggleDrawer = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };
  return (
    <section className={styles.section}>
      <div>
        <h1>FAQs</h1>
        <p>..</p>
      </div>
      <div className=''>
        {FAQList.map(({ question, answer }, index) => {
          return (
            <div key={index} className={styles.item}  onClick={() => {
                  toggleDrawer(index);
                }}>
              <div
                className={styles.itemHeader}>
                <h3>{question}</h3>
                {/* <span>more</span> */}
              </div>
              <p
                className={`${styles.answer} ${
                  index === expandedId ? styles.expandedAnswer : ''
                }`}
              >
                {answer}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
export default FAQs;
