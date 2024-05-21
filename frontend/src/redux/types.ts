import { StateWithHistory } from 'redux-undo';
import { FrameEditorState } from './slices';

export const FRAME_EDITOR_REDUX_NAMESPACE = 'LOGICFORGE_FRAME_EDITOR';

export type LogicForgeReduxStateSnapshot = {
  [FRAME_EDITOR_REDUX_NAMESPACE]: FrameEditorState;
};

export type LogicForgeReduxState = StateWithHistory<LogicForgeReduxStateSnapshot>;
