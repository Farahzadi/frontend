import Head from 'next/head';
import React from 'react';

const CustomizedHead = ({
  title = 'Dexpresso exchange',
  type = 'website',
  description = 'Dexpresso is a decentralized exchange',
  relativePath = '',
  imgUrl = '/images/logo/Dexpresso_horizontal.png',
}) => {
    const baseUrl = NEXT_PUBLIC_BASE_URL || '';
    const imgSrc = baseUrl+ imgUrl;
    const url = baseUrl+ relativePath;
  return (
    <Head>
      <meta property='og:title' content={title} />
      <meta property='og:type' content={type} />
      <meta property='og:site_name' content='Dexpresso exchange' />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={imgSrc} />
      <meta property='og:image:type' content='image/png' />
      <meta property='og:image:width' content='400' />
      <meta property='og:image:height' content='300' />
      <meta property='og:image:alt' content='Logo alt' />
      <meta property='og:url' content={url} />
    </Head>
  );
};
export default CustomizedHead;
