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
  PARAMETER = 'PARAMETER',
}

export type TypeSpec = {
  type: SpecType.TYPE;
  id: string;
  supertypes: string[];
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
  properties?: { [key: string]: string[] };
};

export type ActionListSpec = {
  type: SpecType.ACTION_LIST;
};

export type ActionSpec = {
  type: SpecType.ACTION;
  actionParameters: { [key: string]: ActionListSpec };
  inputParameters: { [key: string]: ParameterSpec };
};

export type ProcessSpec = {
  type: SpecType.PROCESS;
  name: string;
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
