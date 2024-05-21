import { TypeId, TypeSpec, TypeSystem, TypeUnion } from '../types';

export function generateTypeSystem(types: { [key: string]: TypeSpec }): TypeSystem {
  const mapping = generateTypeMapping(types);
  const typeIds = canonicalTypeUnion(Object.keys(mapping));
  const parents = Object.entries(mapping)
    .filter(([, typeInfo]) => typeInfo.supertypes.length > 0)
    .map(([typeId, typeInfo]) => {
      return { [typeId]: canonicalTypeUnion(typeInfo.supertypes) };
    })
    .reduce((collect, value) => {
      return Object.assign(collect, value);
    }, {});
  const children = Object.entries(mapping)
    .filter(([, typeInfo]) => typeInfo.subtypes.length > 0)
    .map(([typeId, typeInfo]) => {
      return { [typeId]: canonicalTypeUnion(typeInfo.subtypes) };
    })
    .reduce((collect, value) => {
      return Object.assign(collect, value);
    }, {});
  const descendants = typeIds
    .map((typeId) => {
      const subtypeKeys = Object.keys(collectSubtypes(typeId, mapping));
      return subtypeKeys.length > 0 ? { [typeId]: canonicalTypeUnion(subtypeKeys) } : {};
    })
    .reduce((collect, value) => {
      return Object.assign(collect, value);
    }, {});
  const ancestors = Object.entries(descendants)
    .map(([typeId, descendantTypeIds]) => {
      return descendantTypeIds.map((descendantTypeId) => [descendantTypeId, typeId]);
    })
    .flat()
    .reduce(
      (collect, nextPair) => {
        const descendantTypeId = nextPair[0];
        const typeId = nextPair[1];
        const existing = collect[descendantTypeId] ? collect[descendantTypeId] : [];
        return {
          ...collect,
          [descendantTypeId]: typeUnion(existing, typeId),
        };
      },
      {} as { [key: string]: string[] },
    );

  return {
    typeIds,
    parents,
    children,
    ancestors,
    descendants,
  };
}

type TypeMapping = {
  [key: string]: TypeInfo;
};

type TypeInfo = {
  readonly typeId: string;
  subtypes: string[];
  supertypes: string[];
};

export function typeEquals(reference: TypeUnion, compare: TypeUnion) {
  return (
    reference.length === compare.length &&
    reference.every((typeId, index) => typeId === compare[index])
  );
}

export function typeUnion(a: TypeUnion | TypeId, b: TypeUnion | TypeId) {
  const unionA: TypeUnion = typeof a === 'string' ? [a] : a;
  const unionB: TypeUnion = typeof b === 'string' ? [b] : b;

  let indexA = 0,
    indexB = 0;

  const output: TypeId[] = [];
  while (indexA < unionA.length || indexB < unionB.length) {
    if (indexA === unionA.length) {
      output.push(...unionB.slice(indexB));
      break;
    }
    if (indexB === unionB.length) {
      output.push(...unionA.slice(indexA));
      break;
    }
    const itemA = unionA[indexA];
    const itemB = unionB[indexB];
    const comparison = itemA.localeCompare(itemB);
    if (comparison < 0) {
      output.push(itemA);
      indexA++;
    } else if (comparison > 0) {
      output.push(itemB);
      indexB++;
    } else {
      output.push(itemA);
      indexA++;
      indexB++;
    }
  }
  return canonicalTypeUnion(output);
}

export function isTypeUnionASubset(reference: TypeUnion | TypeId, toCompare: TypeUnion | TypeId) {
  const ref: TypeUnion = typeof reference === 'string' ? [reference] : reference;
  const compare: TypeUnion = typeof toCompare === 'string' ? [toCompare] : toCompare;

  // verify that every ID in the toCompare arg is represented in the reference arg
  return compare.every((typeId) => {
    return binarySearch(ref, typeId) >= 0;
  });
}

export function canonicalTypeUnion(typeIds: TypeId[]) {
  // copy the union, sort, then remove any duplicates
  return [...typeIds.sort()].filter((value, index, array) => {
    return array.indexOf(value) === index;
  });
}

export function doesTypeMatchRequirements(
  input: TypeUnion,
  requirements: TypeUnion,
  typeSystem: TypeSystem,
) {
  // each potential type in the input union must be contained by a type in the requirements
  for (const typeId of input) {
    if (binarySearch(requirements, typeId) < 0) {
      // type not directly declared -- check inheritance
      let found = false;
      for (let requiredTypeId of requirements) {
        const requirementDescendants = typeSystem.descendants[requiredTypeId];
        if (requirementDescendants && binarySearch(requirementDescendants, typeId) >= 0) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Converts a type system to its full representation containing all matching subtypes
 * @param type
 * @param typeSystem
 */
export function expandType(type: TypeUnion, typeSystem: TypeSystem) {
  return type
    .map((typeId) => {
      return typeUnion(typeId, typeSystem.descendants[typeId] || []);
    })
    .reduce((collect, current) => {
      return typeUnion(collect, current);
    }, [] as TypeUnion);
}

function binarySearch(arr: TypeUnion, item: TypeId) {
  let startIndex = 0,
    endIndex = arr.length - 1;

  while (startIndex <= endIndex) {
    const searchIndex = Math.floor((startIndex + endIndex) / 2);
    const searchItem = arr[searchIndex];
    const comparison = item.localeCompare(searchItem);
    if (comparison === 0) {
      return searchIndex;
    } else if (comparison < 0) {
      endIndex = searchIndex - 1;
    } else {
      startIndex = searchIndex + 1;
    }
  }

  return -1;
}

function generateTypeMapping(types: { [key: string]: TypeSpec }): TypeMapping {
  const out: { [key: string]: TypeInfo } = {};

  // create the initial type info mappings and record child -> parent relationships
  const parentMap: { [key: string]: string[] } = {};
  Object.entries(types).forEach(([key, value]) => {
    out[key] = {
      typeId: key,
      supertypes: [...value.supertypes],
      subtypes: [],
    };
    value.supertypes.forEach((parentId) => {
      let children = parentMap[parentId];
      if (children === undefined) {
        children = [];
        parentMap[parentId] = children;
      }
      children.push(key);
    });
  });

  // iterate through the parentMap, setting parent/child relationships
  Object.entries(parentMap).forEach(([parentId, childIds]) => {
    const parentType = out[parentId];
    childIds.forEach((childId) => {
      const childType = out[childId];
      parentType.subtypes.push(childType.typeId);
    });
  });

  return out;
}

function collectSubtypes(parentTypeId: string, typeMapping: TypeMapping) {
  const subtypes: { [key: string]: TypeInfo } = {};
  let subtypeMappings: { [key: string]: TypeInfo } = {};
  const typeInfo = typeMapping[parentTypeId];
  if (typeInfo !== undefined) {
    subtypeMappings[parentTypeId] = typeInfo;
  }
  while (Object.keys(subtypeMappings).length > 0) {
    const nextGeneration: { [key: string]: TypeInfo } = {};
    Object.entries(subtypeMappings).forEach(([key, value]) => {
      if (!subtypes.hasOwnProperty(key)) {
        if (key !== parentTypeId) {
          subtypes[key] = value;
        }
        value.subtypes.forEach((subtypeId) => {
          nextGeneration[subtypeId] = typeMapping[subtypeId];
        });
      }
    });
    subtypeMappings = nextGeneration;
  }
  return subtypes;
}
