import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ConfigType, ControlType, EngineSpec, ProcessConfig, SpecType } from './types';
import { FrameEditor } from './components';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/roboto';
import translations from './i18n/en.json';

const customizedTranslations = Object.assign(
  {
    processes: {
      example: {
        title: 'Example Process',
        description: 'A process used for demonstration',
      },
    },
  },
  translations,
);

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

// This specification struct would likely be provided by the server in actual usage
const specification: EngineSpec = {
  type: SpecType.ENGINE,
  processes: {
    example: {
      type: SpecType.PROCESS,
      inputs: {
        input: {
          type: SpecType.VARIABLE,
          title: 'A text String',
          typeId: 'java.lang.String',
          multi: false,
          optional: false,
        },
      },
      name: 'example',
    },
  },
  actions: {
    'store-variable': {
      type: SpecType.ACTION,
      metadata: {
        DYNAMIC_RETURN_TYPE: 'value',
      },
      inputs: {
        value: {
          type: SpecType.EXPRESSION,
          typeId: 'java.lang.Object',
          multi: false,
          metadata: {},
        },
      },
    },
    log: {
      type: SpecType.ACTION,
      metadata: {},
      inputs: {
        message: {
          type: SpecType.EXPRESSION,
          typeId: 'java.lang.String',
          multi: false,
          metadata: {},
        },
        level: {
          type: SpecType.EXPRESSION,
          typeId: 'io.logicforge.logging.LogLevel',
          multi: false,
          metadata: {},
        },
      },
    },
  },
  functions: {
    concatenate: {
      type: SpecType.FUNCTION,
      output: {
        type: SpecType.EXPRESSION,
        typeId: 'java.lang.String',
        multi: false,
        metadata: {},
      },
      inputs: {
        values: {
          type: SpecType.EXPRESSION,
          multi: true,
          typeId: 'java.lang.String',
          metadata: {},
        },
      },
      metadata: {},
    },
    min: {
      type: SpecType.FUNCTION,
      output: {
        type: SpecType.EXPRESSION,
        typeId: 'java.lang.Number',
        multi: false,
        metadata: {},
      },
      inputs: {
        values: {
          type: SpecType.EXPRESSION,
          multi: true,
          typeId: 'java.lang.Number',
          metadata: {},
        },
      },
      metadata: {},
    },
    and: {
      type: SpecType.FUNCTION,
      output: {
        type: SpecType.EXPRESSION,
        typeId: 'java.lang.Boolean',
        multi: false,
        metadata: {},
      },
      inputs: {
        values: {
          type: SpecType.EXPRESSION,
          multi: true,
          typeId: 'java.lang.Boolean',
          metadata: {},
        },
      },
      metadata: {},
    },
  },
  types: {
    'java.lang.Object': {
      type: SpecType.TYPE,
      supertypes: [],
      id: 'java.lang.Object',
      properties: {},
      valueType: false,
    },
    'java.lang.String': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Object'],
      id: 'java.lang.String',
      properties: {},
      valueType: true,
    },
    'java.lang.Number': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Object'],
      id: 'java.lang.Number',
      properties: {},
      valueType: true,
    },
    'java.lang.Integer': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Number'],
      id: 'java.lang.Integer',
      properties: {},
      valueType: true,
    },
    'java.lang.Float': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Number'],
      id: 'java.lang.Float',
      properties: {},
      valueType: true,
    },
    'java.lang.Boolean': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Object'],
      id: 'java.lang.Boolean',
      properties: {},
      valueType: true,
      values: ['true', 'false'],
    },
    boolean: {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Object'],
      id: 'boolean',
      properties: {},
      valueType: true,
      values: ['true', 'false'],
    },
    'io.logicforge.logging.LogLevel': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Object'],
      id: 'io.logicforge.logging.LogLevel',
      properties: {},
      valueType: true,
      values: ['ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'],
    },
  },
  controls: [ControlType.CONDITIONAL],
};

// This configuration would be provided from the server (if editing an existing config) or
//  created from an empty structure (if creating a new config)
const process: ProcessConfig = {
  type: ConfigType.PROCESS,
  name: 'example',
  rootBlock: {
    type: ConfigType.BLOCK,
    executables: [
      {
        type: ConfigType.ACTION,
        name: 'log',
        arguments: {
          message: [
            {
              type: ConfigType.FUNCTION,
              name: 'concatenate',
              arguments: {
                values: [
                  {
                    type: ConfigType.VALUE,
                    value: 'Hello',
                  },
                  {
                    type: ConfigType.VALUE,
                    value: ', ',
                  },
                  {
                    type: ConfigType.VALUE,
                    value: 'World',
                  },
                  {
                    type: ConfigType.FUNCTION,
                    name: 'concatenate',
                    arguments: {
                      values: [
                        {
                          type: ConfigType.VALUE,
                          value: '!',
                        },
                        {
                          type: ConfigType.VALUE,
                          value: '!',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
          level: [
            {
              type: ConfigType.VALUE,
              value: 'INFO',
            },
          ],
        },
      },
      {
        type: ConfigType.ACTION,
        name: 'log',
        arguments: {
          message: [
            {
              type: ConfigType.FUNCTION,
              name: 'concatenate',
              arguments: {
                values: [
                  {
                    type: ConfigType.VALUE,
                    value: 'Hello',
                  },
                  {
                    type: ConfigType.VALUE,
                    value: ', ',
                  },
                  {
                    type: ConfigType.VALUE,
                    value: 'World',
                  },
                  {
                    type: ConfigType.FUNCTION,
                    name: 'concatenate',
                    arguments: {
                      values: [
                        {
                          type: ConfigType.VALUE,
                          value: '!',
                        },
                        {
                          type: ConfigType.VALUE,
                          value: '!',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
          level: [
            {
              type: ConfigType.VALUE,
              value: 'INFO',
            },
          ],
        },
      },
    ],
  },
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={themeOptions}>
      <CssBaseline />
      <FrameEditor
        config={process}
        engineSpec={specification}
        translations={customizedTranslations}
      />
    </ThemeProvider>
  </React.StrictMode>,
);
