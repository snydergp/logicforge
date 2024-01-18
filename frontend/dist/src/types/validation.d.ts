export interface Validator {
    validate(value: string): string[];
}
export declare class RegexValidator implements Validator {
    private readonly _regex;
    constructor(regex: RegExp);
    validate(value: string): string[];
}
export declare class MinLengthValidator implements Validator {
    private readonly _limit;
    constructor(limit: number);
    validate(value: string): string[];
}
export declare class MaxLengthValidator implements Validator {
    private readonly _limit;
    constructor(limit: number);
    validate(value: string): string[];
}
