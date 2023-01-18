import React, { useState } from 'react';
import { Media } from '../../../utils/media';
import styles from './RoadMap.module.css';
const DESCRIPTION = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua`;
const RoadMap = () => {
  const data = [
    {
      id: 1,
      title: 'Title 1',
      subtitle: 'subtitle 1',
      description: DESCRIPTION,
    },
    {
      id: 2,
      title: 'Title 2',
      subtitle: 'subtitle 2',
      description: DESCRIPTION,
    },
    {
      id: 3,
      title: 'Title 3',
      subtitle: 'subtitle 3',
      description: DESCRIPTION,
    },
    {
      id: 4,
      title: 'Title 4',
      subtitle: 'subtitle 4',
      description: DESCRIPTION,
    },
    {
      id: 5,
      title: 'Title 5',
      subtitle: 'subtitle 5',
      description: DESCRIPTION,
    },
    {
      id: 6,
      title: 'Title 6',
      subtitle: 'subtitle 6',
      description: DESCRIPTION,
    },
  ];

  const roadMap = [
    {id: 1, part: 'Q1', year: '2022'},
    {id: 2, part: 'Q2', year: '2022'},
    {id: 3, part: 'Q3', year: '2022'},
    {id: 4, part: 'Q4', year: '2022'},
    {id: 5, part: 'Q1', year: '2023'},
    {id: 6, part: 'Q2', year: '2023'},
  ];
  const [activeSection, setActiveSection] = useState(1);

  const descriptionElm = ({ title, subtitle, description, id }, key) => (
    <div key={key} className={`${styles.item} ${id === activeSection ? styles.activeSection : ""}`}>
      <div className={styles.innerItem}>
        <h2 className={styles.itemTitle}>{title}</h2>
        <h3 className={styles.itemSubtitle}>{subtitle}</h3>
        <p className={styles.itemDescription}>{description}</p>
      </div>
    </div>
  );
  const roadMapElm = (val, key, length) => (
    <li className={`${styles.roadMapItem} ${val.id === activeSection ? styles.activeItem : ""}`} key={key}
    onClick={() => setActiveSection(val.id)}>
      <span>{val.part}</span>
      <span>-</span>
      <span>{val.year}</span>
    </li>
  );
  return (
    <section className={styles.section}>
      <div className={styles.mainContainer}>
        <div className={styles.stepsContainer}>
          <ul className={styles.stepsList}>
            {roadMap.map((val, index, list) => roadMapElm(val, index, list.length) )}

          </ul>
        </div>
        <div className={styles.descriptionContainer}>
          {data.map((val, index) => descriptionElm(val, index))}
        </div>
      </div>
    </section>
  );
};
export default RoadMap;
