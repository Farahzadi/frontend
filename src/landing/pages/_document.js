import { Html, Head, Main, NextScript } from 'next/document'
import { mediaStyle } from '../utils/media'

export default function Document() {
    return (
        <Html>
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;400;500;700;800&display=swap" rel="stylesheet" />
                <style type="text/css" dangerouslySetInnerHTML={{__html: mediaStyle}} />
            </Head>
            <body>
            <Main />
            <NextScript />
            </body>
        </Html>
    )
}