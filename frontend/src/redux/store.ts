import frameEditorReducer, { editorsGroupBy } from './slices/editor';
import { configureStore, Store } from '@reduxjs/toolkit';
import undoable from 'redux-undo';

let store: Store;

function initializeStore() {
  if (store !== undefined) {
    throw new Error('Attempted to re-initialize with a new store');
  }

  store = configureStore({
    reducer: {
      LOGICFORGE_FRAME_EDITOR: undoable(frameEditorReducer, { groupBy: editorsGroupBy }),
    },
  });
}

export function getStore() {
  if (store === undefined) {
    initializeStore();
  }
  return store;
}
