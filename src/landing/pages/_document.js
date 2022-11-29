import { Html, Head, Main, NextScript } from 'next/document';
import { mediaStyle } from '../utils/media';

export default function Document() {
  return (
    <Html>
      <Head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, viewport-fit=cover'
        />
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='/meta/apple-touch-icon.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='192x192'
          href='/meta/android-chrome-192x192.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='96x96'
          href='/images/logo/dexpresso_logo.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/meta/favicon-32x32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='/meta/favicon-16x16.png'
        />
        <link rel='manifest' href='/meta/site.webmanifest'></link>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin />
        <link
          href='https://fonts.googleapis.com/css2?family=Inter:wght@100;200;400;500;700;800&display=swap'
          rel='stylesheet'
        />
        <style
          type='text/css'
          dangerouslySetInnerHTML={{ __html: mediaStyle }}
        />
        <link
          href='https://fonts.cdnfonts.com/css/ostrich-sans-2'
          rel='stylesheet'
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
