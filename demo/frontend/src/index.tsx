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
const locale = 'en';

// this would likely be returned from the server or CMS in actual usage
const translations = {
  processes: {
    example: {
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
    setVariable: {
      title: 'Set Variable',
      description: 'Stores a value in the execution context',
      parameters: {
        value: {
          title: 'Value',
          description: 'The value to store',
        },
        name: {
          title: 'Variable Name',
          description: 'The name to use for the stored variable',
        },
      },
    },
    deleteVariable: {
      title: 'Delete Variable',
      description: 'Deletes a value from the execution context',
      parameters: {
        name: {
          title: 'Variable Name',
          description: 'The name of the variable to delete',
        },
      },
    },
    incrementCounter: {
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

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={themeOptions}>
      <CssBaseline />
      <App translations={translations} locale={locale}></App>
    </ThemeProvider>
  </React.StrictMode>,
);
