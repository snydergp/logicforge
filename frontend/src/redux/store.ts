import frameEditorReducer from './slices/editor';
import { configureStore, Store } from '@reduxjs/toolkit';

let store: Store;

function initializeStore() {
  if (store !== undefined) {
    throw new Error('Attempted to re-initialize with a new store');
  }

  store = configureStore({
    reducer: {
      LOGICFORGE_FRAME_EDITOR: frameEditorReducer,
    },
  });
}

export function getStore() {
  if (store === undefined) {
    initializeStore();
  }
  return store;
}
