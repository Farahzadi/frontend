import { Html, Head, Main, NextScript } from 'next/document'
import { mediaStyle } from '../utils/media'

export default function Document() {
    return (
        <Html>
            <Head>
                <link rel="icon" type="image/png" sizes="16x16" href="/dexpresso-16x16.ico" />
                <link rel="icon" type="image/png" sizes="32x32" href="/dexpresso-32x32.ico" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;400;500;700;800&display=swap" rel="stylesheet" />
                <meta property='og:title' content='Dexpresso exchange' />
                <meta property='og:type' content='website' />
                <meta property='og:site_name' content='Dexpresso exchange' />
                <meta property='og:description' content='Dexpresso is a decentralized exchange' />
                <meta property='og:image' content='/images/logo/Dexpresso_horizontal.png' />
                <meta property="og:image:type" content="image/png" />
                <meta property="og:image:width" content="400" />
                <meta property="og:image:height" content="300" />
                <meta property='og:image:alt' content='Logo alt' />
                <meta property='og:url' content='https://dexpresso.exchange' />
                <style type="text/css" dangerouslySetInnerHTML={{__html: mediaStyle}} />
                <link href="https://fonts.cdnfonts.com/css/ostrich-sans-2" rel="stylesheet" />
            </Head>
            <body>
            <Main />
            <NextScript />
            </body>
        </Html>
    )
}
