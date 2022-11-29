import Image from 'next/image';
import React from 'react';
import CustomizedHead from '../components/Head/Head';
import Img404 from '../public/images/sad-logo-dark.png';
const NotFoundPage = () => {
  return (
    <>
      <CustomizedHead></CustomizedHead>
      <div className='center-container'>
        <Image width={400} height={300} src={Img404} alt='404' />
        <div className='not-found-text'>
          <p>This page does not exist</p>
          <p>404</p>
        </div>
      </div>
    </>
  );
};
export default NotFoundPage;
