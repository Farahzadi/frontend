import React from 'react';
import Image from 'next/image';
import styles from './ContactBar.module.css'
import youtube from "/public/images/social/youtube.svg";
import twitter from "/public/images/social/twitter.svg";
import chat from "/public/images/social/chat.svg";
import discord from "/public/images/social/discord.svg";
import github from "/public/images/social/github.svg";
import telegram from "/public/images/social/telegram.svg";
import { Discord, Github, Telegram, Twitter, Youtube } from '../Icons/Icons';

const ContactBar = () => {
  const socialMedias = [
    {Comp: Twitter, alt: 'twitter', href:''},
    {Comp: Github, alt: 'github', href:'' },
    {Comp: Youtube, alt: 'youtube', href:''},
    {Comp: Telegram, alt: 'telegram', href:''},
    {Comp: Discord, alt: 'discord', href:''},
  ];
    return(
        <div className={styles.sideMenu}>
        {socialMedias.map(({Comp, alt, href}, index) => (
          <a key={index} href={href}>
            <Comp width={24} height={24} />
          </a>

        ))}
        </div>
    )
}
export default ContactBar;