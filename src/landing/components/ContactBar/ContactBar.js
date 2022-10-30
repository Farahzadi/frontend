import React from 'react';
import Image from 'next/image';
import styles from './ContactBar.module.css'
import youtube from "/public/images/social/youtube.svg";
import twitter from "/public/images/social/twitter.svg";
import chat from "/public/images/social/chat.svg";
import whatsApp from "/public/images/social/WhatsApp.svg";
import github from "/public/images/social/github.svg";
import telegram from "/public/images/social/telegram.svg";

const ContactBar = () => {
  const socialMedias = [
    {src: twitter, alt: 'twitter', href:''},
    {src: github, alt: 'github', href:'' },
    {src: youtube, alt: 'youtube', href:''},
    {src: telegram, alt: 'telegram', href:''},
    {src: whatsApp, alt: 'whatsapp', href:''},
  ];
    return(
        <div className={styles.sideMenu}>
        {socialMedias.map(({src, alt, href}, index) => (
          <a key={index} href={href}>
            <Image src={src} width={24} height={24} alt={alt} />
          </a>

        ))}
        </div>
    )
}
export default ContactBar;