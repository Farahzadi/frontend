import React from 'react';
import FAQs from '../components/FAQs/FAQs';
import CustomizedHead from '../components/Head/Head';

const FAQ = () => {
  return (
    <>
      <CustomizedHead title='FAQ'></CustomizedHead>
      <div>
        <FAQs />
      </div>
    </>
  );
};
export default FAQ;
