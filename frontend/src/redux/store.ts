import editorsReducer, { editorsGroupBy } from './slices/editors';
import { configureStore, Store } from '@reduxjs/toolkit';
import undoable from 'redux-undo';

let store: Store;

function initializeStore() {
  if (store !== undefined) {
    throw new Error('Attempted to re-initialize with a new store');
  }

  store = configureStore({
    reducer: {
      LOGICFORGE: undoable(editorsReducer, { groupBy: editorsGroupBy }),
    },
  });
}

export function getStore() {
  if (store === undefined) {
    initializeStore();
  }
  return store;
}
