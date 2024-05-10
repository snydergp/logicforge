import { EditorState } from './slices/editor';

export type FullStoreShape = {
  ['LOGICFORGE']: {
    past: EditorState[];
    present: EditorState;
    future: EditorState[];
  };
};

export type StoreStructure = Partial<FullStoreShape>;
