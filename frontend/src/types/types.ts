export type TypeId = string;

/**
 * A list of type IDs representing type intersection. The data structure should always be sorted and
 * non-repeating
 */
export type TypeIntersection = readonly TypeId[];

export const VOID_TYPE: TypeIntersection = [];

/**
 * A data structure that captures all type relationships for later reuse
 */
export type TypeSystem = {
  /**
   * An array of all defined type IDs
   */
  typeIds: TypeIntersection;
  /**
   * A mapping between a type id and an array of all types from which the key DIRECTLY inherits
   */
  parents: { [key: TypeId]: TypeIntersection };
  /**
   * A mapping between a type id and an array of all types for which the key is DIRECTLY inherited
   */
  children: { [key: TypeId]: TypeIntersection };
  /**
   * A mapping between a type id and an array of all types from which the key inherits, both
   * DIRECTLY and INDIRECTLY
   */
  ancestors: { [key: TypeId]: TypeIntersection };
  /**
   * A mapping between a type id and an array of all types for which the key is inherited, both
   * DIRECTLY and INDIRECTLY
   */
  descendants: { [key: TypeId]: TypeIntersection };
};
