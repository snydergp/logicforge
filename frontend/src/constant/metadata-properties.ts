export enum MetadataProperties {
  /**
   * Property key set on a function or action that has a return type that changes dependent on the
   * type of one of its inputs. The value of this property points to the name of the input from
   * which the type is derived
   */
  DYNAMIC_RETURN_TYPE = 'DYNAMIC_RETURN_TYPE',
  /**
   * Property key set on an input whose type must match that of another input. The value is the
   * name of the input against which this input is type constrained
   */
  MUST_MATCH_TYPE = 'MUST_MATCH_TYPE',
}
