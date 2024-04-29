import { EditorState } from './slices/editors';

export type FullStoreShape = {
  ['LOGICFORGE']: {
    past: EditorState[];
    present: EditorState;
    future: EditorState[];
  };
};

export type StoreStructure = Partial<FullStoreShape>;
