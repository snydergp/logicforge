import { TypeSpec } from '../types';

export type TypeInfo = {
  readonly typeId: string;
  subtypes: string[];
  supertypes: string[];
};

export function generateTypeMappings(types: { [key: string]: TypeSpec }): {
  [key: string]: TypeInfo;
} {
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

export function collectSubtypes(parentTypeId: string, typeMapping: { [key: string]: TypeInfo }) {
  const subtypes: { [keys: string]: TypeInfo } = {};
  let subtypeMappings: { [key: string]: TypeInfo } = {};
  const typeInfo = typeMapping[parentTypeId];
  if (typeInfo !== undefined) {
    subtypeMappings[parentTypeId] = typeInfo;
  }
  while (Object.keys(subtypeMappings).length > 0) {
    const nextGeneration: { [key: string]: TypeInfo } = {};
    Object.entries(subtypeMappings).forEach(([key, value]) => {
      subtypes[key] = value;
      value.subtypes.forEach((subtypeId) => {
        nextGeneration[subtypeId] = typeMapping[subtypeId];
      });
    });
    subtypeMappings = nextGeneration;
  }
  return subtypes;
}
