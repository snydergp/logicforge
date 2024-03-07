export enum ErrorCode {
  /** A required value is missing (empty value-type input) */
  MISSING_REQUIRED_VALUE = 'MISSING_REQUIRED_VALUE',
  /** A required value is invalid (value-type input not matching type) */
  INVALID_VALUE = 'INVALID_VALUE',
  /** A reference to a future action result (out of order reference) */
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  /** A reference to an optional initial variable or a conditional variable outside a check */
  UNCHECKED_REFERENCE = 'UNCHECKED_REFERENCE',
  /** An expression (function or reference) of a type not convertable to its required input type */
  UNSATISFIED_INPUT = 'UNSATISFIED_INPUT',
}
