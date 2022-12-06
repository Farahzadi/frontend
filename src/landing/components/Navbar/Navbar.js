import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useContext } from 'react';
import styles from './Navbar.module.css';
import ContactBar from '../ContactBar/ContactBar';
import logo from '../../public/images/logo/Dexpresso_logo_theme.svg';
import { Arrow } from '../Icons/Icons';
import { BGContext } from '../../contexts/BGContext';
import { useRouter } from 'next/router';
import ClientPortal from '../ClientPortal/ClientPortal';
import { getBaseUrl, getDocsLink, getTradeLink } from '../../utils/env';

const Navbar = () => {
  const links = [
    { label: 'About', href: '/about-us', target: 'self' },
    { label: 'Developers', href: `${getDocsLink()}/Develop`, target: 'blank' },
    { label: 'Community', href: `${getDocsLink()}/Community`, target: 'blank' },
    { label: 'Docs', href: getDocsLink(), target: 'blank' },
  ];
  const { isAnimated } = useContext(BGContext);
  const [visible, setIsVisible] = useState(false);
  const route = useRouter();
  useEffect(() => {
    if (route.pathname !== '/') {
      setIsVisible(true);
    } else if (isAnimated) {
      setIsVisible(true);
    }
  }, [isAnimated, route]);
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
    <>
      <nav
        className={` ${visible ? 'is-visible' : 'is-hidden'} ${
          !isTop && !isExpanded ? `${styles.blurBG} ${styles.nav}` : styles.nav
        }`}
      >
        <Link href='/'>
          <div className={styles.logoContainer}>
            <Image
              className={styles.logoImg}
              src={logo}
              height={43}
              width={30}
              alt='Logo'
            />
            <span className={styles.brandName}>DEXPRESSO</span>
          </div>
        </Link>
        <div
          className={`${styles.navItems} ${
            isExpanded ? ` ${styles.expanded}` : ''
          }`}
          onClick={handleCloseMenuBar}
        >
          <div className={styles.navItemInnerContainer}>
            <div className={styles.navLinks}>
              {links.map((item, index) => {
                if (item.target === 'blank') {
                  return (
                    <a
                      key={index}
                      href={item.href}
                      target='_blank'
                      rel='noreferrer noopener'
                      className={styles.navLink}
                    >
                      <span>{item.label}</span>
                      <Arrow className={styles.arrowIcon} />
                    </a>
                  );
                } else {
                  return (
                    <Link passHref key={index} href={item.href}>
                      <div className={styles.navLink}>
                        <span>{item.label}</span>
                        <Arrow className={styles.arrowIcon} />
                      </div>
                    </Link>
                  );
                }
              })}
            </div>
            <div className={styles.bottomSection}>
              <div className={styles.contactSection}>
                <ContactBar />
              </div>
              <Link href={getTradeLink()}>
                <button type='button' className={styles.tradeBtn}>
                  TRADE
                </button>
              </Link>
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
      <ClientPortal selector={'__next'}>
        <button type='button' className={styles.fixedTradeBtn}>
          START TRADING
        </button>
      </ClientPortal>
    </>
  );
};

export default Navbar;
