import frameEditorReducer from './slices/frameEditor';
import { configureStore, Store } from '@reduxjs/toolkit';
import { FRAME_EDITOR_REDUX_NAMESPACE } from './types';

let store: Store;

function initializeStore() {
  if (store !== undefined) {
    throw new Error('Attempted to re-initialize with a new store');
  }

  store = configureStore({
    reducer: {
      [FRAME_EDITOR_REDUX_NAMESPACE]: frameEditorReducer,
    },
  });
}

export function getStore() {
  if (store === undefined) {
    initializeStore();
  }
  return store;
}
