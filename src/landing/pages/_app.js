import '../styles/globals.css';
import Layout from '../components/Layout/Layout';
import '@fortawesome/fontawesome-svg-core/styles.css'; // import Font Awesome CSS
import { config } from '@fortawesome/fontawesome-svg-core';
import { MediaContextProvider } from '../utils/media';
import { BGContext } from '../contexts/BGContext';
import { useState } from 'react';
config.autoAddCss = false;

function MyApp({ Component, pageProps }) {
  const [isAnimated, setIsAnimated] = useState(false);
  return (
    <MediaContextProvider disableDynamicMediaQueries>
      <BGContext.Provider value={{isAnimated, setIsAnimated}}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </BGContext.Provider>
    </MediaContextProvider>
  );
}

export default MyApp;
