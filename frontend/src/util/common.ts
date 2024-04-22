export function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function mergeDeep(target: { [key: string]: any }, ...sources: any[]): object {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(source)) {
    const sourceObject = source as object;
    for (const key in sourceObject) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
