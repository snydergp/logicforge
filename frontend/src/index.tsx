import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ConfigType, EngineSpec, ProcessConfig, SpecType } from './types';
import { FrameEditor } from './components';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/roboto';

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

// real-world usage might pull this from browser locale
const locale = 'en';

// this would likely be returned from the server or CMS in actual usage
const messages = {
  processes: {
    EXAMPLE: {
      title: 'Example Process',
      description: 'A process used to demonstrate the frontend',
      parameters: {
        root: {
          title: 'Actions',
          description: 'The primary action list',
        },
      },
    },
  },
  actions: {
    'set-variable': {
      title: 'Set Variable',
      description: 'Stores a value in the execution context',
      parameters: {
        value: {
          title: 'Value',
          description: 'The value to store',
        },
        variableName: {
          title: 'Variable Name',
          description: 'The name to use for the stored variable',
        },
      },
    },
    'delete-variable': {
      title: 'Delete Variable',
      description: 'Deletes a value from the execution context',
      parameters: {
        variableName: {
          title: 'Variable Name',
          description: 'The name of the variable to delete',
        },
      },
    },
    'increment-counter': {
      title: 'Increment Counter',
      description: 'Increments a counter stored as a variable.',
      parameters: {
        variableName: {
          title: 'Variable Name',
          description: 'The name of the variable containing the counter',
        },
        count: {
          title: 'Count',
          description: 'The amount to increment the counter by. Defaults to 1.',
        },
      },
    },
  },
  functions: {
    concatenate: {
      title: 'Concatenate',
      description: 'Combine multiple text values into a single output string',
      parameters: {
        values: {
          title: 'Values',
          description: 'The text values to concatenate together',
        },
      },
    },
    min: {
      title: 'Minimum',
      description: 'Find the minimum value in a list of numbers',
      parameters: {
        values: {
          title: 'Values',
          description: 'The number values in which to find the minimum',
        },
      },
    },
    and: {
      title: 'And',
      description: 'Returns true only if all children also return true',
      parameters: {
        values: {
          title: 'Values',
          description: 'The child values to evaluate',
        },
      },
    },
  },
  types: {
    'java.lang.String': {
      title: 'Text',
    },
    'java.lang.Boolean': {
      title: 'Boolean',
    },
    'java.lang.Integer': {
      title: 'Integer (Short)',
    },
    'java.lang.Long': {
      title: 'Integer (Long)',
    },
    'java.lang.Float': {
      title: 'Decimal (Short)',
    },
    'java.lang.Decimal': {
      title: 'Decimal (Long)',
    },
  },
};

// This specification struct would likely be provided by the server in actual usage
const specification: EngineSpec = {
  type: SpecType.ENGINE,
  processes: {
    EXAMPLE: {
      type: SpecType.PROCESS,
      name: 'example',
    },
  },
  actions: {
    'set-variable': {
      type: SpecType.ACTION,
      inputs: {
        value: {
          type: SpecType.INPUT,
          returnType: 'java.lang.Object',
          multi: false,
        },
        variableName: {
          type: SpecType.INPUT,
          returnType: 'java.lang.String',
          multi: false,
        },
      },
      actions: {},
    },
    'delete-variable': {
      type: SpecType.ACTION,
      inputs: {
        variableName: {
          type: SpecType.INPUT,
          returnType: 'java.lang.String',
          multi: false,
        },
      },
      actions: {},
    },
    'increment-counter': {
      type: SpecType.ACTION,
      inputs: {
        variableName: {
          type: SpecType.INPUT,
          returnType: 'java.lang.String',
          multi: false,
        },
        count: {
          type: SpecType.INPUT,
          returnType: 'java.lang.Integer',
          multi: false,
        },
      },
      actions: {},
    },
  },
  functions: {
    concatenate: {
      type: SpecType.FUNCTION,
      outputType: 'java.lang.String',
      inputs: {
        values: {
          type: SpecType.INPUT,
          multi: true,
          returnType: 'java.lang.String',
          properties: {},
        },
      },
    },
    min: {
      type: SpecType.FUNCTION,
      outputType: 'java.lang.Number',
      inputs: {
        values: {
          type: SpecType.INPUT,
          multi: true,
          returnType: 'java.lang.Number',
          properties: {},
        },
      },
    },
    and: {
      type: SpecType.FUNCTION,
      outputType: 'java.lang.Boolean',
      inputs: {
        values: {
          type: SpecType.INPUT,
          multi: true,
          returnType: 'java.lang.Boolean',
          properties: {},
        },
      },
    },
  },
  types: {
    'java.lang.String': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Object'],
      id: 'java.lang.String',
    },
    'java.lang.Object': {
      type: SpecType.TYPE,
      supertypes: [],
      id: 'java.lang.Object',
    },
    'java.lang.Number': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Object'],
      id: 'java.lang.Number',
    },
    'java.lang.Integer': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Number'],
      id: 'java.lang.Integer',
    },
    'java.lang.Float': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Number'],
      id: 'java.lang.Float',
    },
    'java.lang.Boolean': {
      type: SpecType.TYPE,
      supertypes: ['java.lang.Object'],
      id: 'java.lang.Boolean',
    },
  },
};

// This configuration would be provided from the server (if editing an existing config) or
//  created from an empty structure (if creating a new config)
const process: ProcessConfig = {
  type: ConfigType.PROCESS,
  name: 'EXAMPLE',
  actions: [
    {
      type: ConfigType.ACTION,
      name: 'set-variable',
      actions: {},
      inputs: {
        value: [
          {
            type: ConfigType.FUNCTION,
            name: 'concatenate',
            inputs: {
              values: [
                {
                  type: ConfigType.VALUE,
                  value: 'Hello',
                },
                {
                  type: ConfigType.FUNCTION,
                  name: 'concatenate',
                  inputs: {
                    values: [
                      {
                        type: ConfigType.VALUE,
                        value: '!!',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
        variableName: [
          {
            type: ConfigType.VALUE,
            value: 'World',
          },
        ],
      },
    },
    {
      type: ConfigType.ACTION,
      name: 'delete-variable',
      actions: {},
      inputs: {
        variableName: [
          {
            type: ConfigType.VALUE,
            value: 'World',
          },
        ],
      },
    },
    {
      type: ConfigType.ACTION,
      name: 'increment-counter',
      actions: {},
      inputs: {
        variableName: [
          {
            type: ConfigType.VALUE,
            value: 'counterVar',
          },
        ],
        count: [
          {
            type: ConfigType.VALUE,
            value: '2',
          },
        ],
      },
    },
  ],
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={themeOptions}>
      <CssBaseline />
      <FrameEditor
        config={process}
        engineSpec={specification}
        translations={messages}
        locale={locale}
      />
    </ThemeProvider>
  </React.StrictMode>,
);
