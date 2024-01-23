import editorsReducer from './slices/editors';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
/*
 * As it is intended for these components to be used as a library to be integrated against instead of a standalone
 * application, we use a passed-in store instead of creating our own store instance. This file allows for an external
 * store to be initialized against this library's reducers, and exposes the store for use by the library's components.
 */
let reducerMap = {};
let store;
export function initializeStore(newStore) {
    if (store !== undefined) {
        throw new Error('Attempted to re-initialize with a new store');
    }
    if (newStore === undefined) {
        store = configureStore({
            reducer: {
                LOGICFORGE: editorsReducer,
            },
        });
    }
    else {
        store = newStore;
        registerReducer({
            LOGICFORGE: editorsReducer,
        });
    }
}
export function getStore() {
    return store;
}
function registerReducer(newReducers) {
    reducerMap = Object.assign(Object.assign({}, reducerMap), newReducers);
    store.replaceReducer(combineReducers(reducerMap));
    return store;
}
