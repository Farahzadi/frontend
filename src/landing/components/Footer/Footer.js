import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';
import ContactBar from '../ContactBar/ContactBar';
import logo from '../../public/images/logo/Dexpresso_logo_theme.svg';
import Image from 'next/image';
const Footer = () => {
  const description = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
  const items = [
    { id: 1, link: '/blog', title: 'Blog', description },
    { id: 2, link: '/faq', title: 'FAQs', description },
    { id: 3, link: '/tutorial', title: 'Tutorials', description },
    { id: 4, link: '', title: 'Terms of Use', description },
    { id: 5, link: '', title: 'Help Center', description },
    { id: 6, link: '', title: 'Mission', description },
    { id: 7, link: '/about-us ', title: 'About Us', description },
    { id: 8, link: '', title: 'Contact Us', description },
    { id: 9, link: '', title: 'API Documentation', description },
    { id: 10, link: '', title: 'Careers', description },
  ];
  return (
    <footer className={styles.footer}>
      <div className={styles.mainContainer}>
        <div className={styles.footerHeader}>
          <Image src={logo} width={95} height={105} alt='dexpresso' />
          <div className={`brand-name ${styles.brandName}`}>Dexpresso</div>
        </div>
        <div className={styles.footerCols}>
          {items.map((val, index) => (
            <div
              key={val.id}
              className={`${styles.footerItem} ${
                val.id === 9 ? styles.fullWidthXS : ''
              }`}
              id={val.id}
            >
              <Link href={val.link}>
                <div>
                  <div className={styles.itemTitle}>
                    <p>{val.title}</p>
                  </div>
                  <div className={styles.itemBody}>
                    <p>{val.description}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className={styles.footerBottom}>
          <ContactBar />
        </div>
      </div>
    </footer>
  );
};
export default Footer;
