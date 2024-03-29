import api from '../../api/api';
import React, { useEffect, useState } from 'react';
import { ConfigType, EngineSpec, FrameEditor, ProcessConfig } from 'logicforge';

enum State {
  LOADING = 'LOADING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export interface AppProps {
  translations: object;
  locale: string;
}

export function App({ translations, locale }: AppProps) {
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
              type: ConfigType.PROCESS,
              name: 'example',
              actions: [],
            }),
        );
      });
  }, []);

  useEffect(() => {
    if (spec !== undefined && process !== undefined) {
      setState(State.READY);
    }
  }, [spec, process]);

  return state === State.READY ? (
    <div>
      <FrameEditor
        config={process as ProcessConfig}
        engineSpec={spec as EngineSpec}
        translations={translations}
        locale={locale}
      ></FrameEditor>
    </div>
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
