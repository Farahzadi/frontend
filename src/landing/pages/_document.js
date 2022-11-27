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
