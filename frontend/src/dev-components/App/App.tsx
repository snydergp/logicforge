import { CssBaseline } from '@mui/material';
import { FrameEditor } from '../../components';
import processConfig from '../../dev-data/process-config.json';
import { EngineSpec, ProcessConfig } from '../../types';
import engineSpec from '../../dev-data/engine-spec.json';
import React from 'react';
import { mergeDeep } from '../../util';
import { MessageTree } from '../../components/I18n/I18n';
import translations from '../../i18n/en.json';
import customTranslations from '../../dev-data/custom-translations.json';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { FRAME_EDITOR_REDUX_NAMESPACE, frameEditorSliceReducer } from '../../redux';
import { Provider } from 'react-redux';

const customizedTranslations = mergeDeep(customTranslations, translations) as MessageTree;

/**
 * A sample app used for local verification only. Demonstrates a basic usage scenario.
 */
export function App() {
  const store = configureStore({
    reducer: combineReducers({
      [FRAME_EDITOR_REDUX_NAMESPACE]: frameEditorSliceReducer,
    }),
  });

  return (
    <Provider store={store}>
      <CssBaseline />
      <FrameEditor
        config={processConfig as ProcessConfig}
        engineSpec={engineSpec as EngineSpec}
        translations={customizedTranslations}
      />
    </Provider>
  );
}
