import { EditorsState } from './slices/editors';
import { Reducer } from 'react';

export type FullStoreShape = {
  ['LOGICFORGE_EDITORS']: EditorsState;
};

export type StoreStructure = Partial<FullStoreShape>;

export type NamespaceKey = keyof StoreStructure;

export type ReducerMap = Partial<{ [k in NamespaceKey]: Reducer<FullStoreShape[k], any> }>;
