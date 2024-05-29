export enum WellKnownType {
  OBJECT = 'java.lang.Object',
  STRING = 'java.lang.String',
  BOOLEAN = 'boolean',
  DOUBLE = 'double',
}

export function isWellKnownNumberType(typeId: string) {
  return typeId === WellKnownType.DOUBLE;
}
