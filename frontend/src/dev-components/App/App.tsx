import { Box, createTheme, CssBaseline, ThemeOptions, ThemeProvider } from '@mui/material';
import { FrameEditor } from '../../components';
import processConfig from '../../dev-data/process-config.json';
import { EngineSpec, ProcessConfig } from '../../types';
import engineSpec from '../../dev-data/engine-spec.json';
import React, { useCallback } from 'react';
import { mergeDeep } from '../../util';
import { MessageTree } from '../../components/I18n/I18n';
import translations from '../../i18n/en.json';
import customTranslations from '../../dev-data/custom-translations.json';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FRAME_EDITOR_REDUX_NAMESPACE,
  frameEditorGroupBy,
  frameEditorSliceReducer,
} from '../../redux';
import { Provider } from 'react-redux';
import undoable, { ActionCreators } from 'redux-undo';
import theme from '../../default-theme.json';

const customizedTranslations = mergeDeep(customTranslations, translations) as MessageTree;
export const themeOptions = createTheme(theme as ThemeOptions);

/**
 * A sample app used for local verification only. Demonstrates a basic usage scenario.
 */
export function App() {
  const store = configureStore({
    reducer: undoable(
      combineReducers({
        [FRAME_EDITOR_REDUX_NAMESPACE]: frameEditorSliceReducer,
      }),
      { groupBy: frameEditorGroupBy },
    ),
  });

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const { key, metaKey, shiftKey } = event;
      if (metaKey && key === 'z') {
        if (!shiftKey) {
          store.dispatch(ActionCreators.undo());
        } else {
          store.dispatch(ActionCreators.redo());
        }
      }
    },
    [store],
  );

  return (
    <Provider store={store}>
      <ThemeProvider theme={themeOptions}>
        <CssBaseline />
        <Box onKeyDown={handleKeyDown}>
          <FrameEditor
            config={processConfig as ProcessConfig}
            engineSpec={engineSpec as EngineSpec}
            translations={customizedTranslations}
          />
        </Box>
      </ThemeProvider>
    </Provider>
  );
}
