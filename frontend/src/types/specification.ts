/*
 * Specifications represent the system-level configurations defining the bounds of how processes can be structured.
 * These include the type system, the structure of processes, and the available actions and functions.
 */

import { WellKnownType } from '../constant/well-known-type';
import { TypeId, TypeIntersection } from './types';

export enum ControlType {
  CONDITIONAL = 'CONDITIONAL',
}

export type TypePropertySpec = {
  type: TypeIntersection;
  multi: boolean;
  optional: boolean;
};

export type TypeSpec = {
  supertypes: TypeId[];
  values?: string[];
  properties: { [key: string]: TypePropertySpec };
  valueType: boolean;
};

export type ExpressionSpec = {
  type: TypeId[];
  multi: boolean;
};

export type VariableSpec = ExpressionSpec & {
  title: string;
  description?: string;
  optional: boolean;
};

export type InputSpec = ExpressionSpec & {
  metadata: { [key: string]: string };
};

export type FunctionSpec = {
  inputs: { [key: string]: InputSpec };
  output: ExpressionSpec;
  metadata: { [key: string]: string };
};

export type ActionSpec = {
  inputs: { [key: string]: InputSpec };
  output?: ExpressionSpec;
  metadata: { [key: string]: string };
};

export type ProcessSpec = {
  inputs: { [key: string]: VariableSpec };
  output?: ExpressionSpec;
};

export type EngineSpec = {
  processes: { [key: string]: ProcessSpec };
  actions: { [key: string]: ActionSpec };
  functions: { [key: string]: FunctionSpec };
  types: { [key: string]: TypeSpec };
  controls: ControlType[];
};

export type ControlSpec = {
  controlType: ControlType;
  inputs: { [key: string]: InputSpec };
};

/**
 * The hardcoded name of the input used to control a conditional statement
 */
export const CONDITIONAL_CONDITION_PROP = 'condition';

/**
 * The hardcoded name of the input used to define a process' return statement
 */
export const PROCESS_RETURN_PROP = 'return';

// controls are not extensible. This hard-coded type provides the structure needed to reuse the
// input code used by actions/functions for controls
export const CONDITIONAL_CONTROL_SPEC: ControlSpec = {
  controlType: ControlType.CONDITIONAL,
  inputs: {
    [CONDITIONAL_CONDITION_PROP]: {
      type: [WellKnownType.BOOLEAN],
      multi: false,
      metadata: {},
    },
  },
};
