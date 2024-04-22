import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { EngineSpec, ProcessConfig } from './types';
import { FrameEditor } from './components';
import { createTheme, CssBaseline, ThemeOptions, ThemeProvider } from '@mui/material';
import '@fontsource/roboto';
import translations from './i18n/en.json';
import customTranslations from './dev-data/custom-translations.json';
import engineSpec from './dev-data/engine-spec.json';
import processConfig from './dev-data/process-config.json';
import theme from './default-theme.json';
import { mergeDeep } from './util';
import { MessageTree } from './components/I18n/I18n';

const customizedTranslations = mergeDeep(customTranslations, translations) as MessageTree;

export const themeOptions = createTheme(theme as ThemeOptions);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={themeOptions}>
      <CssBaseline />
      <FrameEditor
        config={processConfig as ProcessConfig}
        engineSpec={engineSpec as EngineSpec}
        translations={customizedTranslations}
      />
    </ThemeProvider>
  </React.StrictMode>,
);
