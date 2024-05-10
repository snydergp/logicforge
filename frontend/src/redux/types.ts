import { EditorState } from './slices/editor';
import { StateWithHistory } from 'redux-undo';

export type LogicForgeReduxState = {
  LOGICFORGE_FRAME_EDITOR: StateWithHistory<EditorState>;
};

export type StoreStructure = LogicForgeReduxState;
