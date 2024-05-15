import api from '../../api/api';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ConfigType,
  en,
  EngineSpec,
  FRAME_EDITOR_REDUX_NAMESPACE,
  FrameEditor,
  frameEditorGroupBy,
  frameEditorSliceReducer,
  mergeDeep,
  ProcessConfig,
} from 'logicforge';
import { MessageTree } from 'logicforge/dist/components/I18n/I18n';
import demoEn from '../../i18n/en.json';
import { Box, createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { ControlBar } from '../ControlBar/ControlBar';
import undoable, { ActionCreators } from 'redux-undo';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

enum State {
  LOADING = 'LOADING',
  READY = 'READY',
  FAILED = 'FAILED',
}

const WEB_SERVER_PROCESS_ID = '00000000-0000-0000-0000-000000000001';

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

export interface AppProps {}

export function App({}: AppProps) {
  const [spec, setSpec] = useState<EngineSpec | undefined>();
  const [process, setProcess] = useState<ProcessConfig | undefined>();
  const [state, setState] = useState<State>(State.LOADING);

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

  useEffect(() => {
    api
      .fetchEngineSpec()
      .then(
        (returnedSpec) => setSpec(returnedSpec),
        () => setState(State.FAILED),
      )
      .then(() => {
        api.fetchProcessConfiguration(WEB_SERVER_PROCESS_ID).then(
          (returnedProcess) => setProcess(returnedProcess),
          () =>
            setProcess({
              differentiator: ConfigType.PROCESS,
              name: 'io.logicforge.demo.model.domain.WebServerProcess',
              returnExpression: [
                {
                  differentiator: ConfigType.FUNCTION,
                  name: 'createHttpResponse',
                  arguments: {
                    status: [
                      {
                        differentiator: ConfigType.VALUE,
                        value: '200',
                        typeId: 'int',
                      },
                    ],
                    body: [
                      {
                        differentiator: ConfigType.VALUE,
                        value: 'Hello, World!',
                        typeId: 'java.lang.String',
                      },
                    ],
                  },
                },
              ],
              externalId: WEB_SERVER_PROCESS_ID,
              rootBlock: { differentiator: ConfigType.BLOCK, executables: [] },
            }),
        );
      });
  }, []);

  useEffect(() => {
    if (spec !== undefined && process !== undefined) {
      setState(State.READY);
    }
  }, [spec, process]);

  const mergedTranslations = mergeDeep({}, demoEn, en);

  return state === State.READY ? (
    <ThemeProvider theme={themeOptions}>
      <CssBaseline />
      <Provider store={store}>
        <Box onKeyDown={handleKeyDown}>
          <FrameEditor
            config={process as ProcessConfig}
            engineSpec={spec as EngineSpec}
            translations={mergedTranslations as MessageTree}
          ></FrameEditor>
          <ControlBar save={api.saveProcessConfiguration} />
        </Box>
      </Provider>
    </ThemeProvider>
  ) : state === State.LOADING ? (
    <div>
      <span>Loading data</span>
    </div>
  ) : (
    <div>
      <span>Failed to load data. Is the server running?</span>
    </div>
  );
}
