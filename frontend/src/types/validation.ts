export interface Validator {
  validate(value: string): string[];
}

export class RegexValidator implements Validator {
  private readonly _regex: RegExp;

  constructor(regex: RegExp) {
    this._regex = regex;
  }

  validate(value: string): string[] {
    if (value != null && value.match(this._regex)) {
      return [`Must match regular expression ${this._regex}`];
    }
    return [];
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
