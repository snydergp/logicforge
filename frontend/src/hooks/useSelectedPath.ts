import { Content, ContentKey } from '../types';
import { useSelector } from 'react-redux';
import { selectSelectedSubtree } from '../redux/slices/editor';
import { StoreStructure } from '../redux';
import { contentEqual } from '../util';

export function useSelectedPath(): ContentKey[] {
  const selectedSubtree = useSelector<StoreStructure, Content[]>(
    selectSelectedSubtree,
    contentEqual,
  );
  if (selectedSubtree === undefined) {
    throw new Error(`Illegal state: selection is undefined`);
  }
  return selectedSubtree.map((content) => content.key);
}
