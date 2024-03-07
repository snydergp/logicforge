/*
 * Specifications represent the system-level configurations defining the bounds of how processes can be structured.
 * These include the type system, the structure of processes, and the available actions and functions.
 */

export enum SpecType {
  ENGINE = 'ENGINE',
  TYPE = 'TYPE',
  TYPE_PROPERTY = 'TYPE_PROPERTY',
  PROCESS = 'PROCESS',
  ACTION = 'ACTION',
  FUNCTION = 'FUNCTION',
  VARIABLE = 'VARIABLE',
  INPUT = 'INPUT',
}

export enum ControlType {
  CONDITIONAL = 'conditional',
}

export type TypePropertySpec = {
  type: SpecType.TYPE_PROPERTY;
  name: string;
  typeId: string;
  optional: boolean;
};

export type TypeSpec = {
  type: SpecType.TYPE;
  id: string;
  supertypes: string[];
  values?: string[];
  properties: { [key: string]: TypePropertySpec };
};

export type FunctionSpec = {
  type: SpecType.FUNCTION;
  outputTypeId: string;
  inputs: { [key: string]: InputSpec };
  metadata: { [key: string]: string };
};

export type VariableSpec = {
  type: SpecType.VARIABLE;
  typeId: string;
  title: string;
  description?: string;
  optional: boolean;
};

export type InputSpec = {
  type: SpecType.INPUT;
  outputTypeId: string;
  multi: boolean;
  metadata: { [key: string]: string };
};

export type ActionSpec = {
  type: SpecType.ACTION;
  inputs: { [key: string]: InputSpec };
  outputTypeId: string | null;
  metadata: { [key: string]: string };
};

export type ProcessSpec = {
  type: SpecType.PROCESS;
  name: string;
  inputs: { [key: string]: VariableSpec };
  outputTypeId: string | null;
};

export type EngineSpec = {
  type: SpecType.ENGINE;
  processes: { [key: string]: ProcessSpec };
  actions: { [key: string]: ActionSpec };
  functions: { [key: string]: FunctionSpec };
  types: { [key: string]: TypeSpec };
  controls: ControlType[];
};
