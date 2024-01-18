import { TypeSpec } from '../types';
export type TypeInfo = {
    readonly typeId: string;
    subtypes: string[];
    supertypes: string[];
};
export declare function generateTypeMappings(types: {
    [key: string]: TypeSpec;
}): {
    [key: string]: TypeInfo;
};
export declare function collectSubtypes(parentTypeId: string, typeMapping: {
    [key: string]: TypeInfo;
}): {
    [keys: string]: TypeInfo;
};
