/*
 * Configs represent the serialization structure for loading/storing process data.
 */

import { ControlType } from './specification';

export enum ConfigType {
  PROCESS = 'PROCESS',
  ACTION = 'ACTION',
  BLOCK = 'BLOCK',
  CONTROL_STATEMENT = 'CONTROL_STATEMENT',
  VALUE = 'VALUE',
  CONDITIONAL_REFERENCE = 'CONDITIONAL_REFERENCE',
  REFERENCE = 'REFERENCE',
  FUNCTION = 'FUNCTION',
  VARIABLE = 'VARIABLE',
}

export type ValueConfig = {
  type: ConfigType.VALUE;
  value: string;
};

export type FunctionConfig = {
  type: ConfigType.FUNCTION;
  name: string;
  arguments: { [key: string]: ExpressionConfig[] };
};

export type ReferenceConfig = {
  type: ConfigType.REFERENCE;
  coordinates: number[];
  path: string[];
};

export type ConditionalReferenceConfig = {
  type: ConfigType.CONDITIONAL_REFERENCE;
  references: number[][];
  expression: ExpressionConfig;
  fallback: ExpressionConfig;
};

export type ActionConfig = {
  type: ConfigType.ACTION;
  name: string;
  arguments: { [key: string]: ExpressionConfig[] };
  output?: VariableConfig;
};

export type BlockConfig = {
  type: ConfigType.BLOCK;
  executables: ExecutableConfig[];
};

export type ControlConfig = {
  type: ConfigType.CONTROL_STATEMENT;
  controlType: ControlType;
  blocks: BlockConfig[];
};

export type ConditionalConfig = ControlConfig & {
  controlType: ControlType.CONDITIONAL;
  conditionalExpression: ExpressionConfig;
};

export type ProcessConfig = {
  type: ConfigType.PROCESS;
  name: string;
  rootBlock: BlockConfig;
  returnExpression?: ExpressionConfig[];
};

export type VariableConfig = {
  type: ConfigType.VARIABLE;
  title: string;
  description?: string;
};

export type ExpressionConfig =
  | ValueConfig
  | FunctionConfig
  | ReferenceConfig
  | ConditionalReferenceConfig;

export type ExecutableConfig = ActionConfig | BlockConfig | ControlConfig;

export type LogicForgeConfig =
  | ProcessConfig
  | ExecutableConfig
  | ExpressionConfig
  | ReferenceConfig
  | VariableConfig;
