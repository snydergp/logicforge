/*
 * Specifications represent the system-level configurations defining the bounds of how processes can be structured.
 * These include the type system, the structure of processes, and the available actions and functions.
 */

export enum SpecType {
  ENGINE = 'engine',
  TYPE = 'type',
  PROCESS = 'process',
  ACTION_LIST = 'actions',
  ACTION = 'action',
  FUNCTION = 'function',
  PARAMETER = 'parameter',
}

export type TypeSpec = {
  type: SpecType.TYPE;
  id: string;
  parentIds: string[];
  values?: string[];
};

export type FunctionSpec = {
  type: SpecType.FUNCTION;
  returnType: string;
  parameters: { [key: string]: ParameterSpec };
};

export type ParameterSpec = {
  type: SpecType.PARAMETER;
  returnType: string;
  multi: boolean;
  required: boolean;
  properties?: { [key: string]: string[] };
};

export type ActionsSpec = {
  type: SpecType.ACTION_LIST;
  name: string;
};

export type ActionSpec = {
  type: SpecType.ACTION;
  parameters: { [key: string]: ParameterSpec | ActionsSpec };
};

export type ProcessSpec = {
  type: SpecType.PROCESS;
  parameters: { [key: string]: ActionsSpec };
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
  | ParameterSpec;
