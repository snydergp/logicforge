import { LogicForgeReduxState } from './types';

export { selectEditorSelection } from './slices/frameEditorSlice';

export const selectCanUndo = (state: LogicForgeReduxState) => {
  return state.past && state.past.length > 0;
};
export const selectCanRedo = (state: LogicForgeReduxState) => {
  return state.future && state.future.length > 0;
};
