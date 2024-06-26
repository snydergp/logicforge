/*
 * Specifications represent the system-level configurations defining the bounds of how processes can be structured.
 * These include the type system, the structure of processes, and the available actions and functions.
 */

import { WellKnownType } from '../constant/well-known-type';
import { TypeId, TypeUnion } from './types';

export enum ControlType {
  CONDITIONAL = 'CONDITIONAL',
}

export type TypePropertySpec = {
  type: TypeUnion;
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

export type InputSpec = ExpressionSpec & {
  metadata: { [key: string]: any };
};

export type CallableSpec = {
  inputs: { [key: string]: InputSpec };
  output: InputSpec;
  metadata: { [key: string]: any };
};

export type EngineSpec = {
  processes: { [key: string]: CallableSpec };
  actions: { [key: string]: CallableSpec };
  functions: { [key: string]: CallableSpec };
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
