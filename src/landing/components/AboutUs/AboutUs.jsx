import React from 'react';
import styles from '../FAQs/FAQs.module.css';
import { DATA } from './data';
const AboutUs = () => {
  const [expandedId, setExpandedId] = React.useState(null);
  const toggleDrawer = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };
  return (
    <div className=''>
      {DATA.map(({ question, answer }, index) => {
        return (
          <div key={index} className={styles.item}>
            <div
              className={styles.itemHeader}
              onClick={() => {
                toggleDrawer(index);
              }}
            >
              <h3>{question}</h3>
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
  );
};
export default AboutUs;
