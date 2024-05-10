import api from '../../api/api';
import React, { useEffect, useState } from 'react';
import { ConfigType, en, EngineSpec, FrameEditor, mergeDeep, ProcessConfig } from 'logicforge';
import { MessageTree } from 'logicforge/dist/components/I18n/I18n';
import demoEn from '../../i18n/en.json';
import { Box, Stack } from '@mui/material';
import { ControlBar } from '../ControlBar/ControlBar';

enum State {
  LOADING = 'LOADING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export interface AppProps {}

export function App({}: AppProps) {
  const [spec, setSpec] = useState<EngineSpec | undefined>();
  const [process, setProcess] = useState<ProcessConfig | undefined>();
  const [state, setState] = useState<State>(State.LOADING);

  useEffect(() => {
    api
      .fetchEngineSpec()
      .then(
        (returnedSpec) => setSpec(returnedSpec),
        () => setState(State.FAILED),
      )
      .then(() => {
        api.fetchProcessConfiguration().then(
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
              externalId: '',
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
    <Box>
      <Stack>
        <FrameEditor
          config={process as ProcessConfig}
          engineSpec={spec as EngineSpec}
          translations={mergedTranslations as MessageTree}
        ></FrameEditor>
        <ControlBar />
      </Stack>
    </Box>
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
