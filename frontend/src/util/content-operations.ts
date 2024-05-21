import {
  ActionContent,
  Content,
  ContentKey,
  ContentStore,
  ContentType,
  FunctionContent,
  IndexedContent,
  ListContent,
} from '../types';

/**
 * Equality function (suitable for use by redux selector) for checking if two content arrays are equal
 * @param a
 * @param b
 */
export function contentEqual(a: Content[], b: Content[]) {
  return a.length === b.length && a.every((model, index) => model.key === b[index].key);
}

/**
 * Given a content store, produce the next available key while updating the store's pointer
 * @param contentStore
 */
export function nextKey(contentStore: ContentStore) {
  return `${contentStore.count++}`;
}

/**
 * Generic function for resolving content given a key, while optionally specifying a type when known
 * @param key the ContentKey
 * @param indexedContent all content
 */
export function resolveContent<T extends Content = Content>(
  key: ContentKey,
  indexedContent: IndexedContent,
): T {
  return indexedContent[key] as T;
}

/**
 * Utility method for traversing up the content tree
 * @param indexedContent all content
 * @param func a function to execute against each node
 * @param initialKey the key representing the node to start recursing at
 * @param ancestorsFirst execute the function starting with the root node and working down to the node represented by the supplied key
 */
export function recurseUp(
  indexedContent: IndexedContent,
  func: (state: Content) => void,
  initialKey: ContentKey,
  ancestorsFirst: boolean = false,
) {
  const content = resolveContent(initialKey, indexedContent);
  if (content === undefined) {
    return;
  }

  if (!ancestorsFirst) {
    func(content);
  }

  if (content.parentKey !== undefined) {
    recurseUp(indexedContent, func, content.parentKey as string, ancestorsFirst);
  }

  if (ancestorsFirst) {
    func(content);
  }
}

/**
 * Utility method for traversing down the content tree
 * @param indexedContent all content
 * @param func a function to execute against each node
 * @param initialKey the key representing the node to start recursing at
 * @param descendantsFirst execute the function starting with descendants and working up to the node represented by the supplied key
 */
export function recurseDown(
  indexedContent: IndexedContent,
  func: (state: Content) => void,
  initialKey: string,
  descendantsFirst: boolean = false,
) {
  const content = resolveContent(initialKey, indexedContent);
  if (content === undefined) {
    return;
  }

  if (!descendantsFirst) {
    func(content);
  }

  switch (content.differentiator) {
    case ContentType.FUNCTION:
      const functionContent = content as FunctionContent;
      Object.entries(functionContent.childKeyMap).forEach(([, childKey]) => {
        recurseDown(indexedContent, func, childKey, descendantsFirst);
      });
      break;
    case ContentType.ACTION:
      const actionContent = content as ActionContent;
      Object.entries(actionContent.childKeyMap).forEach(([, childKey]) => {
        recurseDown(indexedContent, func, childKey, descendantsFirst);
      });
      break;
    case ContentType.PROCESS:
    case ContentType.BLOCK:
    case ContentType.ARGUMENT:
      const listContent = content as ListContent;
      listContent.childKeys.forEach((childKey) => {
        recurseDown(indexedContent, func, childKey, descendantsFirst);
      });
      break;
    case ContentType.VALUE:
      // no children
      break;
  }

  if (descendantsFirst) {
    func(content);
  }
}
