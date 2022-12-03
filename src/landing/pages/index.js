import Head from 'next/head';
import Image from 'next/image';
import React, { useContext, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Media } from '../utils/media';
// components
import FeatureSection from '../components/Sections/Feature/Feature';
import GuideSection from '../components/Sections/Guide/Guide';
import Trades from '../components/Sections/Trades/Trades';
import NoFiat from '../components/Sections/NoFiat/NoFiat';
import Decentralization from '../components/Sections/Decentralization';
import Layer2Trade from '../components/Sections/Layer2Trade/Layer2Trade';
import IntroSection from '../components/Sections/Intro/Intro';
import Market from '../components/Sections/Market/Market';
import MarketMobile from '../components/Sections/Market/Market.mobile';
import Mobile from '../components/Sections/Mobile/Mobile';
import RoadMap from '../components/Sections/RoadMap/Roadmap';
import Background from '../components/Sections/Background/Background';
import ContactBar from '../components/ContactBar/ContactBar';
import { BGContext } from '../contexts/BGContext';
import CustomizedHead from '../components/Head/Head';
import Networks from '../components/Sections/Networks/Network';
import { getNetworks, getTradeStats } from '../api/API';

export default function Home({ networks, trades }) {
  const { isAnimated } = useContext(BGContext);
  return (
    <>
      <CustomizedHead>
        <meta
          name='description'
          content='Dexpresso is a decentralized exchange'
        ></meta>
      </CustomizedHead>
      <Background />
      <div className={isAnimated ? 'is-visible' : 'is-hidden'}>
        <div className='stars-bg'>
          <div className='stars-blend'>
            <IntroSection />
            <Trades trades={trades} />
            <Networks networks={networks} />
            <div className='contact-bar'>
              <ContactBar />
            </div>
            <FeatureSection />
            <Media lessThan='md'>
              <Mobile />
            </Media>
            <GuideSection />
            {/* <Media lessThan='sm'>
              <MarketMobile />
            </Media>
            <Media greaterThanOrEqual='md'>
              <Market />
            </Media> */}
            <Decentralization />
            <NoFiat />
            <RoadMap />
            <Layer2Trade />
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = async (context) => {
  const netResponse = await getNetworks();
  const tradeRes = await getTradeStats();
  return {
    props: {
      networks: netResponse?.networks || [],
      trades: tradeRes?.summary || [],
    },
  };
};
