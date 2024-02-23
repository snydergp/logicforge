/*
 * Specifications represent the system-level configurations defining the bounds of how processes can be structured.
 * These include the type system, the structure of processes, and the available actions and functions.
 */

export enum SpecType {
  ENGINE = 'ENGINE',
  TYPE = 'TYPE',
  PROCESS = 'PROCESS',
  ACTION_LIST = 'ACTION_LIST',
  ACTION = 'ACTION',
  FUNCTION = 'FUNCTION',
  VARIABLE = 'VARIABLE',
  INPUT = 'INPUT',
}

export type TypeSpec = {
  type: SpecType.TYPE;
  id: string;
  supertypes: string[];
  values?: string[];
};

export type FunctionSpec = {
  type: SpecType.FUNCTION;
  outputType: string;
  inputs: { [key: string]: InputSpec };
};

export type VariableSpec = {
  type: SpecType.VARIABLE;
  typeId: string;
  optional: boolean;
};

export type InputSpec = {
  type: SpecType.INPUT;
  returnType: string;
  multi: boolean;
  properties?: { [key: string]: string[] };
};

export type ActionListSpec = {
  type: SpecType.ACTION_LIST;
};

export type ActionSpec = {
  type: SpecType.ACTION;
  actions: { [key: string]: ActionListSpec };
  inputs: { [key: string]: InputSpec };
};

export type ProcessSpec = {
  type: SpecType.PROCESS;
  name: string;
  variables: VariableSpec[];
  returnValue: VariableSpec;
};

export type EngineSpec = {
  type: SpecType.ENGINE;
  processes: { [key: string]: ProcessSpec };
  actions: { [key: string]: ActionSpec };
  functions: { [key: string]: FunctionSpec };
  types: { [key: string]: TypeSpec };
};

export type LogicForgeSpec =
  | EngineSpec
  | TypeSpec
  | ProcessSpec
  | ActionSpec
  | FunctionSpec
  | InputSpec;
