export class RegexValidator {
    constructor(regex) {
        this._regex = regex;
    }
    validate(value) {
        if (value != null && value.match(this._regex)) {
            return [`Must match regular expression ${this._regex}`];
        }
        return [];
    }
}
export class MinLengthValidator {
    constructor(limit) {
        this._limit = limit;
    }
    validate(value) {
        if (value != null && value.length < this._limit) {
            return [`Must be ${this._limit} characters or more`];
        }
        return [];
    }
}
export class MaxLengthValidator {
    constructor(limit) {
        this._limit = limit;
    }
    validate(value) {
        if (value != null && value.length > this._limit) {
            return [`Must be ${this._limit} characters or fewer`];
        }
        return [];
    }
}
