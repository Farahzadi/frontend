import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useContext } from 'react';
import styles from './Navbar.module.css';
import ContactBar from '../ContactBar/ContactBar';
import logo from '../../public/images/Logo.svg';
import { Arrow } from '../Icons/Icons';
import { BGContext } from '../../contexts/BGContext';

const Navbar = () => {
  const links = [
    { label: 'About', href: '/about-us' },
    { label: 'Developers', href: '' },
    { label: 'Community', href: '' },
    { label: 'Docs', href: '' },
  ];
  const { isAnimated } = useContext(BGContext);
  function onScroll() {
    if (
      document.body.scrollTop > 150 ||
      document.documentElement.scrollTop > 150
    ) {
      setIsTop(false);
    } else {
      setIsTop(true);
    }
  }
  useEffect(() => {
    window.addEventListener('scroll', onScroll);
  }, []);

  const [isTop, setIsTop] = useState(true);
  const [isExpanded, expandMenu] = useState(false);
  function handleClickMenu() {
    if (isExpanded) {
      handleCloseMenuBar();
    } else {
      handleOpenMenu();
    }
  }
  function handleOpenMenu() {
    expandMenu(true);
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    window.removeEventListener('scroll', onScroll);
  }
  function handleCloseMenuBar() {
    expandMenu(false);
    document.body.style.height = 'unset';
    document.body.style.overflow = 'auto';
    window.addEventListener('scroll', onScroll);
  }
  return (
    <div className={isAnimated ? 'is-visible' : 'is-hidden'}>
      <nav
        className={`${
          !isTop && !isExpanded ? `${styles.blurBG} ${styles.nav}` : styles.nav
        }`}
      >
        <Link href='/'>
          <a className={styles.logoContainer}>
            <Image
              className={styles.logoImg}
              src={logo}
              height={43}
              width={110}
              alt='Logo'
            />
            <span className={styles.brandName}>DEXPRESSO</span>
          </a>
        </Link>
        <div
          className={`${styles.navItems} ${
            isExpanded ? ` ${styles.expanded}` : ''
          }`}
          onClick={handleCloseMenuBar}
        >
          <div className={styles.navItemInnerContainer}>
            <div className={styles.navLinks}>
              {links.map((item, index) => (
                <Link key={index} href={item.href}>
                  <a className={styles.navLink}>
                    <span>{item.label}</span>
                    <Arrow className={styles.arrowIcon} />
                  </a>
                </Link>
              ))}
            </div>
            <div className={styles.bottomSection}>
              <div className={styles.contactSection}>
                <ContactBar />
              </div>
              <button type='button' className={styles.tradeBtn}>
                TRADE
              </button>
            </div>
          </div>
        </div>
        <div
          className={`${styles.hamburgerIconContainer} ${
            isExpanded ? styles.crossIconContainer : ''
          }`}
          onClick={handleClickMenu}
        >
          <div className={styles.rect}></div>
          <div className={styles.rect}></div>
          <div className={styles.rect}></div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;