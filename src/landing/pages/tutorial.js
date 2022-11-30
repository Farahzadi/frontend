import react from 'react';
import CustomizedHead from '../components/Head/Head';
import Tutorial from '../components/Tutorial';

const index = () => {
  return (
    <>
      <CustomizedHead title='Tutorial'></CustomizedHead>
      <div className='container'>
        <Tutorial />
      </div>
    </>
  );
};
export default index;
