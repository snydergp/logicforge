import processReducer, { EDITORS_SLICE_NAME } from './slices/editors';
import { combineReducers, configureStore, Store } from '@reduxjs/toolkit';
import { ReducerMap, StoreStructure } from './types';

/*
 * As it is intended for these components to be used as a library to be integrated against instead of a standalone
 * application, we use a passed-in store instead of creating our own store instance. This file allows for an external
 * store to be initialized against this library's reducers, and exposes the store for use by the library's components.
 */

let reducerMap: ReducerMap = {};

let store: Store;

export function initializeStore(newStore?: Store) {
  if (store !== undefined) {
    throw new Error('Attempted to re-initialize with a new store');
  }
  if (newStore == undefined) {
    store = configureStore({
      reducer: {
        [EDITORS_SLICE_NAME]: processReducer,
      },
    });
  } else {
    store = newStore;
    registerReducer({
      [EDITORS_SLICE_NAME]: processReducer,
    });
  }
}

export function getStore() {
  return store;
}

function registerReducer(newReducers: ReducerMap): Store<StoreStructure> {
  reducerMap = { ...reducerMap, ...newReducers };
  store.replaceReducer(combineReducers(reducerMap));
  return store;
}
