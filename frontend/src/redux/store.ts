import editorsReducer from './slices/editors';
import { configureStore, Store } from '@reduxjs/toolkit';

let store: Store;

function initializeStore() {
  if (store !== undefined) {
    throw new Error('Attempted to re-initialize with a new store');
  }
  store = configureStore({
    reducer: {
      LOGICFORGE: editorsReducer,
    },
  });
}

export function getStore() {
  if (store === undefined) {
    initializeStore();
  }
  return store;
}
