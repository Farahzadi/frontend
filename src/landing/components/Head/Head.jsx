import Head from 'next/head';
import React from 'react';
import { getBaseUrl } from '../../utils/env';

const CustomizedHead = ({
  title = 'Dexpresso',
  type = 'website',
  description = 'Dexpresso is a decentralized exchange',
  relativePath = '',
  imgUrl = '/images/logo/Dexpresso_horizontal.png',
  children
}) => {
    const baseUrl = getBaseUrl();
    const imgSrc = baseUrl + imgUrl;
    const url = baseUrl + relativePath;
  return (
    <Head>
      <title>{title}</title>
      <meta property='og:title' content={title} />
      <meta property='og:type' content={type} />
      <meta property='og:site_name' content='Dexpresso' />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={imgSrc} />
      <meta property='og:image:type' content='image/png' />
      <meta property='og:image:width' content='400' />
      <meta property='og:image:height' content='300' />
      <meta property='og:image:alt' content='Logo alt' />
      <meta property='og:url' content={url} />
      {children}
    </Head>
  );
};
export default CustomizedHead;
