import { useContext } from 'react';
import { BGContext } from '../../contexts/BGContext';
import Footer from '../Footer/Footer';
import Navbar from '../Navbar/Navbar';
import Background from '../Sections/Background/Background';
import styles from './Layout.module.css';
const Layout = ({ children }) => {
    return (
      <>
        <Navbar />
        {children}
        <Footer />
      </>
    );

};

export default Layout;
