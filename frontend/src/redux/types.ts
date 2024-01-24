import { EditorState } from './slices/editors';

export type FullStoreShape = {
  ['LOGICFORGE']: EditorState;
};

export type StoreStructure = Partial<FullStoreShape>;
