import { toNumber } from 'lodash';
import { EngineSpec } from './specification';
import { WellKnownType } from '../constant/well-known-type';

export enum ErrorCode {
  /** A required value is invalid (value-type input not matching type) */
  INVALID_VALUE = 'INVALID_VALUE',
  /** A reference to a variable that has not yet been set */
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  /** A reference to an optional initial variable or a conditional variable outside a check */
  UNCHECKED_REFERENCE = 'UNCHECKED_REFERENCE',
  /** An expression (function or reference) of a type not convertable to its required input type */
  UNSATISFIED_INPUT = 'UNSATISFIED_INPUT',
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
  data: { [key: string]: string };
};

export function validateValue(
  value: string,
  typeId: string,
  engineSpec: EngineSpec,
): ValidationError[] {
  const validator = getValidatorForType(typeId, engineSpec);
  return validator.validate(value);
}

function getValidatorForType(typeId: string, engineSpec: EngineSpec) {
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
    return new EnumValidator(typeSpec.values);
  }
  return NEVER_VALID;
}

interface Validator {
  validate(value: string): ValidationError[];
}

class RequiredValidator implements Validator {
  private readonly error: ValidationError = {
    code: ErrorCode.INVALID_REFERENCE,
    level: ErrorLevel.ERROR,
    data: {},
  };

  validate(value: string) {
    return [...(value.length === 0 ? [this.error] : [])];
  }
}

class RegexValidator implements Validator {
  private readonly _regex: RegExp;
  private readonly _error: ValidationError;

  constructor(regex: RegExp, message: string = 'i18n:labels.error-must-match-regex') {
    this._regex = regex;
    this._error = {
      code: ErrorCode.INVALID_VALUE,
      level: ErrorLevel.ERROR,
      data: {
        message: message,
        regex: this._regex.source,
      },
    };
  }

  validate(value: string) {
    return [...(value !== null && !value.match(this._regex) ? [this._error] : [])];
  }
}

class EnumValidator implements Validator {
  private readonly _values: string[];
  private readonly _error: ValidationError;

  constructor(values: string[]) {
    this._values = values;
    this._error = {
      code: ErrorCode.INVALID_VALUE,
      level: ErrorLevel.ERROR,
      data: {
        message: 'i18n:labels.error-must-match-enum',
        values: this._values.join(', '),
      },
    };
  }

  validate(value: string) {
    return [...(this._values.indexOf(value) < 0 ? [this._error] : [])];
  }
}

export const ALWAYS_VALID: Validator = {
  validate() {
    return [];
  },
};

class NeverValid implements Validator {
  private readonly _error: ValidationError;

  constructor(message: string) {
    this._error = {
      code: ErrorCode.INVALID_VALUE,
      level: ErrorLevel.ERROR,
      data: {
        message: message,
      },
    };
  }

  validate() {
    return [this._error];
  }
}

class CompositeValidator implements Validator {
  private readonly _validators: Validator[];

  constructor(validators: Validator[]) {
    this._validators = validators;
  }

  validate(value: string) {
    for (let validator of this._validators) {
      const errors = validator.validate(value);
      if (errors !== undefined && errors.length > 0) {
        // stop at the first validator to find errors. Subsequent validators can be built on assumptions verified by
        //  previous validators (e.g., string represents an integer value)
        return errors;
      }
    }
    return [];
  }
}

class NumericRangeValidator implements Validator {
  private readonly _min: number;
  private readonly _max: number;
  private readonly _lessThanError: ValidationError;
  private readonly _greaterThanError: ValidationError;

  constructor(min: number, max: number) {
    this._min = min;
    this._max = max;
    this._lessThanError = {
      code: ErrorCode.INVALID_VALUE,
      level: ErrorLevel.ERROR,
      data: {
        message: 'i18n:labels.error-less-than-range',
        min: this._min.toString(),
      },
    };
    this._greaterThanError = {
      code: ErrorCode.INVALID_VALUE,
      level: ErrorLevel.ERROR,
      data: {
        message: 'i18n:labels.error-greater-than-range',
        min: this._max.toString(),
      },
    };
  }

  validate(value: string) {
    const number = toNumber(value);
    return number < this._min
      ? [this._lessThanError]
      : number > this._max
      ? [this._greaterThanError]
      : [];
  }
}

const NEVER_VALID: Validator = new NeverValid('i18n:invalid-value-select-function-or-variable');

const REQUIRED: Validator = new RequiredValidator();

const BOOLEAN_STRING: Validator = new EnumValidator(['true', 'false']);

const INTEGER_STRING: Validator = new CompositeValidator([
  REQUIRED,
  new RegexValidator(/^(-?[1-9]+[0-9]*)|0$/, 'Must be a valid integer'),
  new NumericRangeValidator(-(2 ** 31), 2 ** 31 - 1),
]);

const LONG_STRING: Validator = new CompositeValidator([
  REQUIRED,
  new RegexValidator(/^(-?[1-9]+[0-9]*)|0$/, 'Must be a valid integer'),
  new NumericRangeValidator(-(2 ** 63), 2 ** 63 - 1),
]);

const DECIMAL_STRING: Validator = new RegexValidator(
  /^-?([0-9]*[1-9][0-9]*(\.[0-9]+)?|0*\.[0-9]*[1-9][0-9]*|0)$/,
);
