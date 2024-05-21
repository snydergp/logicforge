export type TypeId = string;

/**
 * A list of type IDs representing type union. The data structure should always be sorted and
 * non-repeating
 */
export type TypeUnion = readonly TypeId[];

export const VOID_TYPE: TypeUnion = [];

/**
 * A data structure that captures all type relationships for later reuse
 */
export type TypeSystem = {
  /**
   * An array of all defined type IDs
   */
  typeIds: TypeUnion;
  /**
   * A mapping between a type id and an array of all types from which the key DIRECTLY inherits
   */
  parents: { [key: TypeId]: TypeUnion };
  /**
   * A mapping between a type id and an array of all types for which the key is DIRECTLY inherited
   */
  children: { [key: TypeId]: TypeUnion };
  /**
   * A mapping between a type id and an array of all types from which the key inherits, both
   * DIRECTLY and INDIRECTLY
   */
  ancestors: { [key: TypeId]: TypeUnion };
  /**
   * A mapping between a type id and an array of all types for which the key is inherited, both
   * DIRECTLY and INDIRECTLY
   */
  descendants: { [key: TypeId]: TypeUnion };
};
