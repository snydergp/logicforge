import { Content, ContentKey } from '../types';
import { useSelector } from 'react-redux';
import { selectSelectedSubtree } from '../redux/slices/frameEditorSlice';
import { LogicForgeReduxState } from '../redux';
import { contentEqual } from '../util';

export function useSelectedPath(): ContentKey[] {
  const selectedSubtree = useSelector<LogicForgeReduxState, Content[]>(
    selectSelectedSubtree,
    contentEqual,
  );
  if (selectedSubtree === undefined) {
    throw new Error(`Illegal state: selection is undefined`);
  }
  return selectedSubtree.map((content) => content.key);
}
