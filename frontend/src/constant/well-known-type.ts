export enum WellKnownType {
  OBJECT = 'java.lang.Object',
  STRING = 'java.lang.String',
  BOOLEAN = 'boolean',
  INTEGER = 'int',
  LONG = 'long',
  FLOAT = 'float',
  DOUBLE = 'double',
}

export function isWellKnownNumberType(typeId: string) {
  return (
    typeId === WellKnownType.INTEGER ||
    typeId === WellKnownType.LONG ||
    typeId === WellKnownType.FLOAT ||
    typeId === WellKnownType.DOUBLE
  );
}
