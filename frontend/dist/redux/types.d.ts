import { EditorsState } from './slices/editors';
import { Reducer } from 'react';
export declare const LOGICFORGE_REDUX_NAMESPACE: unique symbol;
export type FullStoreShape = {
    [LOGICFORGE_REDUX_NAMESPACE]: EditorsState;
};
export type StoreStructure = Partial<FullStoreShape>;
export type NamespaceKey = keyof StoreStructure;
export type ReducerMap = Partial<{
    [k in NamespaceKey]: Reducer<FullStoreShape[k], any>;
}>;
