import React from 'react';
import { Media } from '../../../utils/media';
import styles from './RoadMap.module.css';
const DESCRIPTION = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua`;
const RoadMap = () => {
  const data = [
    {
      title: 'Title 1',
      subtitle: 'subtitle 1',
      description: DESCRIPTION,
    },
    {
      title: 'Title 2',
      subtitle: 'subtitle 2',
      description: DESCRIPTION,
    },
    {
      title: 'Title 3',
      subtitle: 'subtitle 3',
      description: DESCRIPTION,
    },
    {
      title: 'Title 4',
      subtitle: 'subtitle 4',
      description: DESCRIPTION,
    },
    {
      title: 'Title 5',
      subtitle: 'subtitle 5',
      description: DESCRIPTION,
    },
    {
      title: 'Title 6',
      subtitle: 'subtitle 6',
      description: DESCRIPTION,
    },
  ];

  const roadMap = [
    {part: 'Q1', year: '2022'},
    {part: 'Q2', year: '2022'},
    {part: 'Q3', year: '2022'},
    {part: 'Q4', year: '2022'},
    {part: 'Q1', year: '2023'},
    {part: 'Q2', year: '2023'},
  ];

  const descriptionElm = ({ title, subtitle, description }, key) => (
    <div key={key} className={styles.item}>
      <h3 className={styles.itemTitle}>{title}</h3>
      <h4 className={styles.itemSubtitle}>{subtitle}</h4>
      <p className={styles.itemDescription}>{description}</p>
    </div>
  );
  const roadMapElm = (val, key, length) => (
    <div className={styles.roadMapItem} key={key}>
      <span>{val.part}</span>
      <Media greaterThan='md'>
        <span>-</span>
      </Media>
      <span>{val.year}</span>
    </div>
  );
  return (
    <section className={styles.section}>
      <div className={styles.mainContainer}>
        {data.map((val, index) => descriptionElm(val, index))}
        {roadMap.map((val, index, list) => roadMapElm(val, index, list.length) )}
      </div>
    </section>
  );
};
export default RoadMap;
