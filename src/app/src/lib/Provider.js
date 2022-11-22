import React from 'react';
import { ToastContainer } from 'react-toastify';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from '@material-ui/core';
import theme from 'lib/muiTheme';
import store, { persistor } from 'lib/store';

import 'react-toastify/dist/ReactToastify.css';

function Provider({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <PersistGate loading={null} persistor={persistor}>
        <ReduxProvider store={store}>
          {children}
          <ToastContainer position="bottom-right" theme="colored" />
        </ReduxProvider>
      </PersistGate>
    </ThemeProvider>
  );
}

export default Provider;
