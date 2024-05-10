import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createTheme, ThemeOptions, ThemeProvider } from '@mui/material';
import '@fontsource/roboto';
import theme from './default-theme.json';
import { App } from './dev-components/App/App';

export const themeOptions = createTheme(theme as ThemeOptions);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={themeOptions}>
      <App></App>
    </ThemeProvider>
  </React.StrictMode>,
);
