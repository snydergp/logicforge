import { toNumber } from 'lodash';

export interface Validator {
  validate(value: string): string[] | undefined;
}

class RequiredValidator implements Validator {
  validate(value: string): string[] | undefined {
    return value.length === 0 ? ['Required'] : undefined;
  }
}

export class RegexValidator implements Validator {
  private readonly _regex: RegExp;
  private readonly _message: string | undefined;

  constructor(regex: RegExp, message?: string) {
    this._regex = regex;
    this._message = message;
  }

  validate(value: string): string[] | undefined {
    if (value !== null && !value.match(this._regex)) {
      return [
        this._message !== undefined
          ? this._message
          : `Must match regular expression ${this._regex}`,
      ];
    }
    return undefined;
  }
}

export class MinLengthValidator implements Validator {
  private readonly _limit: number;

  constructor(limit: number) {
    this._limit = limit;
  }

  validate(value: string): string[] {
    if (value != null && value.length < this._limit) {
      return [`Must be ${this._limit} characters or more`];
    }
    return [];
  }
}

export class MaxLengthValidator implements Validator {
  private readonly _limit: number;

  constructor(limit: number) {
    this._limit = limit;
  }

  validate(value: string): string[] {
    if (value != null && value.length > this._limit) {
      return [`Must be ${this._limit} characters or fewer`];
    }
    return [];
  }
}

export class EnumValidator implements Validator {
  private readonly _values: string[];

  constructor(values: string[]) {
    this._values = values;
  }

  validate(value: string): string[] | undefined {
    return this._values.indexOf(value) >= 0 ? undefined : ['Not a valid enumerated value'];
  }
}

export const ALWAYS_VALID: Validator = {
  validate(value: string): string[] | undefined {
    return undefined;
  },
};

export class CompositeValidator implements Validator {
  private readonly _validators: Validator[];

  constructor(validators: Validator[]) {
    this._validators = validators;
  }

  validate(value: string): string[] | undefined {
    for (let validator of this._validators) {
      const errors = validator.validate(value);
      if (errors !== undefined && errors.length > 0) {
        // stop at the first validator to find errors. Subsequent validators can be built on assumptions verified by
        //  previous validators (e.g., string represents an integer value)
        return errors;
      }
    }
    return undefined;
  }
}

export class NumericRangeValidator implements Validator {
  private readonly _min: number;
  private readonly _max: number;

  constructor(min: number, max: number) {
    this._min = min;
    this._max = max;
  }
  validate(value: string): string[] | undefined {
    const number = toNumber(value);
    return number < this._min
      ? [`Value must be greater than ${this._min}`]
      : number > this._max
      ? [`Value must be less than ${this._max}`]
      : undefined;
  }
}

export const REQUIRED: Validator = new RequiredValidator();

export const BOOLEAN_STRING: Validator = new EnumValidator(['true', 'false']);

export const INTEGER_STRING: Validator = new CompositeValidator([
  REQUIRED,
  new RegexValidator(/^(-?[1-9]+[0-9]*)|0$/, 'Must be a valid integer'),
  new NumericRangeValidator(-(2 ** 31), 2 ** 31 - 1),
]);

export const LONG_STRING: Validator = new CompositeValidator([
  REQUIRED,
  new RegexValidator(/^(-?[1-9]+[0-9]*)|0$/, 'Must be a valid integer'),
  new NumericRangeValidator(-(2 ** 63), 2 ** 63 - 1),
]);

export const DECIMAL_STRING: Validator = new RegexValidator(
  /^-?([0-9]*[1-9][0-9]*(\.[0-9]+)?|0*\.[0-9]*[1-9][0-9]*|0)$/,
);
