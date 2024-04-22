import { TypeSpec } from '../types';

/**
 * A data structure that captures all type relationships for later reuse
 */
export type TypeSystem = {
  /**
   * An array of all defined type IDs
   */
  typeIds: string[];
  /**
   * A mapping between a type id and an array of all types from which the key DIRECTLY inherits
   */
  parents: { [key: string]: string[] };
  /**
   * A mapping between a type id and an array of all types for which the key is DIRECTLY inherited
   */
  children: { [key: string]: string[] };
  /**
   * A mapping between a type id and an array of all types from which the key inherits, both
   * DIRECTLY and INDIRECTLY
   */
  ancestors: { [key: string]: string[] };
  /**
   * A mapping between a type id and an array of all types for which the key is inherited, both
   * DIRECTLY and INDIRECTLY
   */
  descendants: { [key: string]: string[] };
};

export function generateTypeSystem(types: { [key: string]: TypeSpec }): TypeSystem {
  const mapping = generateTypeMapping(types);
  const typeIds = Object.keys(mapping);
  const parents = Object.entries(mapping)
    .filter(([typeId, typeInfo]) => typeInfo.supertypes.length > 0)
    .map(([typeId, typeInfo]) => {
      return { [typeId]: typeInfo.supertypes };
    })
    .reduce((collect, value) => {
      return Object.assign(collect, value);
    }, {});
  const children = Object.entries(mapping)
    .filter(([typeId, typeInfo]) => typeInfo.subtypes.length > 0)
    .map(([typeId, typeInfo]) => {
      return { [typeId]: typeInfo.subtypes };
    })
    .reduce((collect, value) => {
      return Object.assign(collect, value);
    }, {});
  const descendants = typeIds
    .map((typeId) => {
      const subtypeKeys = Object.keys(collectSubtypes(typeId, mapping));
      return subtypeKeys.length > 0 ? { [typeId]: subtypeKeys } : {};
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
          [descendantTypeId]: [...existing, typeId],
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
