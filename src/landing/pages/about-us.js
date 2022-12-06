import React from 'react';
import AboutUs from '../components/AboutUs/AboutUs';
import CustomizedHead from '../components/Head/Head';

const index = () => {
  return (
    <>
      <CustomizedHead title='About Dexpresso Team'></CustomizedHead>
      <section>
        <div>
          <h2>About Us</h2>
        </div>
        <div>
          <AboutUs />
        </div>
      </section>
    </>
  );
};
export default index;
