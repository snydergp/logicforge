import { Content, ContentKey, ContentType } from '../types';
import { useSelector } from 'react-redux';
import { selectContentByKey } from '../redux/slices/frameEditorSlice';

/**
 * Resolves typed content by key
 * @param contentKey the key
 * @param contentType an optional differentiator to verify against (throws exception if mismatch)
 */
export function useContent<TYPE extends Content>(
  contentKey: ContentKey,
  contentType?: ContentType,
): TYPE {
  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined) {
    throw new Error(`Attempted to load missing content, key: ${contentKey}`);
  }
  if (contentType !== undefined) {
    if (content.differentiator !== contentType) {
      throw new Error(
        `Expected content with key ${contentKey} to be of type ${contentType} but found ${content.differentiator}`,
      );
    }
    return content as TYPE;
  }
  return content as TYPE;
}
