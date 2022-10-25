import Image from 'next/image';
import react from 'react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import styles from './Tutorial.module.css';
const Tutorial = () => {
  const slides = [
    {
      img: 'tutorial.png',
      caption:
        '1 This text is suppose to help you find your way through trading here.',
    },
    {
      img: 'tutorial.png',
      caption:
        '2 This text is suppose to help you find your way through trading here.',
    },
    {
      img: 'tutorial.png',
      caption:
        '3 This text is suppose to help you find your way through trading here.',
    },
  ];
  return (
      <div className={styles.container}>
        <Slide
          autoplay={false}
          cssClass={styles.sliderWrapper}
          transitionDuration='700'
        >
          {slides.map((val, index) => (
            <div key={index}>
              <p className={styles.caption}>{val.caption}</p>
              <div className={styles.imageContainer}>
                <Image
                  src={'/images/tutorial/' + val.img}
                  alt={val.caption}
                  width='700px'
                  height='430px'
                />
              </div>
            </div>
          ))}
        </Slide>
      </div>
  );
};
export default Tutorial;
