/*
 * Specifications represent the system-level configurations defining the bounds of how processes can be structured.
 * These include the type system, the structure of processes, and the available actions and functions.
 */

import { WellKnownType } from '../constant/well-known-type';

export enum SpecType {
  ENGINE = 'ENGINE',
  TYPE = 'TYPE',
  TYPE_PROPERTY = 'TYPE_PROPERTY',
  PROCESS = 'PROCESS',
  ACTION = 'ACTION',
  FUNCTION = 'FUNCTION',
  VARIABLE = 'VARIABLE',
  EXPRESSION = 'EXPRESSION',
  CONTROL = 'CONTROL',
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
  valueType: boolean;
};

export type FunctionSpec = {
  type: SpecType.FUNCTION;
  inputs: { [key: string]: ExpressionSpec };
  output: ExpressionSpec;
  metadata: { [key: string]: string };
};

export type VariableSpec = {
  type: SpecType.VARIABLE;
  typeId: string;
  multi: boolean;
  title: string;
  description?: string;
  optional: boolean;
};

export type ExpressionSpec = {
  type: SpecType.EXPRESSION;
  typeId: string;
  multi: boolean;
  metadata: { [key: string]: string };
};

export type ActionSpec = {
  type: SpecType.ACTION;
  inputs: { [key: string]: ExpressionSpec };
  output?: ExpressionSpec;
  metadata: { [key: string]: string };
};

export type ProcessSpec = {
  type: SpecType.PROCESS;
  name: string;
  inputs: { [key: string]: VariableSpec };
  output?: ExpressionSpec;
};

export type EngineSpec = {
  type: SpecType.ENGINE;
  processes: { [key: string]: ProcessSpec };
  actions: { [key: string]: ActionSpec };
  functions: { [key: string]: FunctionSpec };
  types: { [key: string]: TypeSpec };
  controls: ControlType[];
};

export type ControlSpec = {
  type: SpecType.CONTROL;
  controlType: ControlType;
  inputs: { [key: string]: ExpressionSpec };
};

// controls are not extensible. This hard-coded type provides the structure needed to reuse the
// input code used by actions/functions for controls
export const CONDITIONAL_CONTROL_SPEC: ControlSpec = {
  type: SpecType.CONTROL,
  controlType: ControlType.CONDITIONAL,
  inputs: {
    condition: {
      type: SpecType.EXPRESSION,
      typeId: WellKnownType.BOOLEAN,
      multi: false,
      metadata: {},
    },
  },
};
