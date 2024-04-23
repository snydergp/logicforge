import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { App } from './components/App/App';

export const themeOptions = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3fb5b1',
    },
    secondary: {
      main: '#da597f',
    },
    background: {
      default: '#282828',
      paper: '#282828',
    },
    success: {
      main: '#b9f6ca',
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={themeOptions}>
      <CssBaseline />
      <App></App>
    </ThemeProvider>
  </React.StrictMode>,
);
