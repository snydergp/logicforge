import { toNumber } from 'lodash';
import { EngineSpec } from './specification';
import { WellKnownType } from '../constant/well-known-type';
import { TypeIntersection } from './types';

export enum ErrorCode {
  /** A required value is invalid (value-type input not matching type) */
  INVALID_VALUE = 'INVALID_VALUE',
  INVALID_VALUE_NO_LITERAL = 'INVALID_VALUE_NO_LITERAL',
  /** A reference to a variable that has not yet been set */
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  /** A reference to an optional initial variable or a conditional variable outside a check */
  UNCHECKED_REFERENCE = 'UNCHECKED_REFERENCE',
  /** An expression (function or reference) of a type not convertable to its required input type */
  UNSATISFIED_INPUT_TYPE_MISMATCH = 'UNSATISFIED_INPUT_TYPE_MISMATCH',
  /** An expression returns multiple values where its input requires a single value */
  UNSATISFIED_INPUT_ARITY_MISMATCH = 'UNSATISFIED_INPUT_ARITY_MISMATCH',
}

export enum ErrorLevel {
  /** Denotes a situation which the user may want to review, but which will not block saving */
  WARNING = 'WARNING',
  /** Denotes an illegal state that will block saving */
  ERROR = 'ERROR',
}

export type ValidationError = {
  /** The code indicating the error scenario */
  code: ErrorCode;
  /** The level of the error */
  level: ErrorLevel;
  /** Additional data regarding the error, used for production of error messages **/
  data: { [key: string]: any };
};

export function validateValue(
  value: string,
  type: TypeIntersection,
  engineSpec: EngineSpec,
): ValidationError[] {
  const validator = getValidatorForType(type, engineSpec);
  return validator(value);
}

function getValidatorForType(type: TypeIntersection, engineSpec: EngineSpec) {
  return compositeValidator(
    type.map((typeId) => {
      const typeSpec = engineSpec.types[typeId];
      if (typeSpec.valueType && Object.values(WellKnownType as object).includes(typeId)) {
        switch (typeId as WellKnownType) {
          case WellKnownType.OBJECT:
            return NEVER_VALID;
          case WellKnownType.STRING:
            return ALWAYS_VALID;
          case WellKnownType.BOOLEAN:
            return BOOLEAN_STRING;
          case WellKnownType.INTEGER:
            return INTEGER_STRING;
          case WellKnownType.LONG:
            return LONG_STRING;
          case WellKnownType.FLOAT:
          case WellKnownType.DOUBLE:
            return DECIMAL_STRING;
        }
      } else if (typeSpec.values !== undefined && typeSpec.values.length > 0) {
        return enumValidator(typeSpec.values);
      } else if (!typeSpec.valueType) {
        return () => [invalidValueNoLiteral(typeId)];
      }
      return NEVER_VALID;
    }),
  );
}

interface Validator {
  (value: string): ValidationError[];
}

function requiredValidator(): Validator {
  return (value: string) => {
    return [
      ...(value.length === 0
        ? [
            {
              code: ErrorCode.INVALID_VALUE,
              level: ErrorLevel.ERROR,
              data: {
                message: 'i18n:errors.messages.required',
              },
            },
          ]
        : []),
    ];
  };
}

function regexValidator(
  regex: RegExp,
  message: string = 'i18n:labels.error-must-match-regex',
): Validator {
  return (value: string) => {
    return [
      ...(value !== null && !value.match(regex)
        ? [
            {
              code: ErrorCode.INVALID_VALUE,
              level: ErrorLevel.ERROR,
              data: {
                message: message,
                regex: regex.source,
              },
            },
          ]
        : []),
    ];
  };
}

function enumValidator(values: string[]): Validator {
  return (value: string) => {
    return [
      ...(values.indexOf(value) < 0
        ? [
            {
              code: ErrorCode.INVALID_VALUE,
              level: ErrorLevel.ERROR,
              data: {
                message: 'i18n:labels.error-must-match-enum',
                values: values.join(', '),
              },
            },
          ]
        : []),
    ];
  };
}

export const ALWAYS_VALID: Validator = () => [];

function neverValid(messageOrError: string | ValidationError): Validator {
  return () => {
    return [
      typeof messageOrError === 'string'
        ? {
            code: ErrorCode.INVALID_VALUE,
            level: ErrorLevel.ERROR,
            data: {
              message: messageOrError,
            },
          }
        : messageOrError,
    ];
  };
}

function compositeValidator(validators: Validator[]): Validator {
  return (value: string) => {
    for (let validator of validators) {
      const errors = validator(value);
      if (errors !== undefined && errors.length > 0) {
        // stop at the first validator to find errors. Subsequent validators can be built on assumptions verified by
        //  previous validators (e.g., string represents an integer value)
        return errors;
      }
    }
    return [];
  };
}

function numericRangeValidator(min: number, max: number): Validator {
  return (value: string) => {
    const number = toNumber(value);
    return number < min
      ? [
          {
            code: ErrorCode.INVALID_VALUE,
            level: ErrorLevel.ERROR,
            data: {
              message: 'i18n:labels.error-less-than-range',
              min: min.toString(),
            },
          },
        ]
      : number > max
      ? [
          {
            code: ErrorCode.INVALID_VALUE,
            level: ErrorLevel.ERROR,
            data: {
              message: 'i18n:labels.error-greater-than-range',
              min: max.toString(),
            },
          },
        ]
      : [];
  };
}

export function unsatisfiedInputTypeMismatch(
  requiredType: TypeIntersection,
  type: TypeIntersection,
): ValidationError {
  return {
    code: ErrorCode.UNSATISFIED_INPUT_TYPE_MISMATCH,
    level: ErrorLevel.ERROR,
    data: { requiredType, type },
  };
}

export function invalidValueNoLiteral(typeId: string): ValidationError {
  return {
    code: ErrorCode.INVALID_VALUE_NO_LITERAL,
    level: ErrorLevel.ERROR,
    data: { typeId },
  };
}

const NEVER_VALID: Validator = neverValid('i18n:invalid-value-select-function-or-variable');

const REQUIRED: Validator = requiredValidator();

const BOOLEAN_STRING: Validator = enumValidator(['true', 'false']);

const INTEGER_STRING: Validator = compositeValidator([
  REQUIRED,
  regexValidator(/^(-?[1-9]+[0-9]*)|0$/, 'i18n:errors.messages.integer'),
  numericRangeValidator(-(2 ** 31), 2 ** 31 - 1),
]);

const LONG_STRING: Validator = compositeValidator([
  REQUIRED,
  regexValidator(/^(-?[1-9]+[0-9]*)|0$/, 'i18n:errors.messages.integer'),
  numericRangeValidator(-(2 ** 63), 2 ** 63 - 1),
]);

const DECIMAL_STRING: Validator = regexValidator(
  /^-?([0-9]*[1-9][0-9]*(\.[0-9]+)?|0*\.[0-9]*[1-9][0-9]*|0)$/,
);
