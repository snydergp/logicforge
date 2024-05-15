function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Performs a deep merge from one or more source objects into a target object. Values are read
 * from each source item in the provided order, and existing properties will not be overwritten.
 * @param target the target object
 * @param sources source objects to merge into the target
 */
export function mergeDeep(target: { [key: string]: any }, ...sources: any[]): object {
  if (!sources.length) {
    return target;
  }
  const source = sources.shift();

  if (isObject(source)) {
    const sourceObject = source as object;
    for (const key in sourceObject) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
