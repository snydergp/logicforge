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

export type Config = {
  differentiator: ConfigType;
};

export type ValueConfig = Config & {
  differentiator: ConfigType.VALUE;
  value: string;
  typeId: string;
};

export type FunctionConfig = Config & {
  differentiator: ConfigType.FUNCTION;
  name: string;
  arguments: { [key: string]: ExpressionConfig[] };
};

export type ReferenceConfig = Config & {
  differentiator: ConfigType.REFERENCE;
  coordinates: readonly number[];
  path: string[];
};

export type ConditionalReferenceConfig = Config & {
  differentiator: ConfigType.CONDITIONAL_REFERENCE;
  references: number[][];
  expression: ExpressionConfig;
  fallback: ExpressionConfig;
};

export type ActionConfig = Config & {
  differentiator: ConfigType.ACTION;
  name: string;
  arguments: { [key: string]: ExpressionConfig[] };
  output?: VariableConfig;
};

export type BlockConfig = Config & {
  differentiator: ConfigType.BLOCK;
  executables: ExecutableConfig[];
};

export type ControlConfig = Config & {
  differentiator: ConfigType.CONTROL_STATEMENT;
  controlType: ControlType;
  blocks: BlockConfig[];
};

export type ConditionalConfig = ControlConfig & {
  controlType: ControlType.CONDITIONAL;
  conditionalExpression: ExpressionConfig;
};

export type ProcessConfig = Config & {
  differentiator: ConfigType.PROCESS;
  name: string;
  rootBlock: BlockConfig;
  returnExpression?: ExpressionConfig[];
  /**
   * Extra data sent by the server to identify the config. This is not used by the front end, but
   * will be held with the process model and returned to the server when updates are made
   * */
  externalId: any;
};

export type VariableConfig = Config & {
  differentiator: ConfigType.VARIABLE;
  title?: string;
  description?: string;
  translationKey?: string;
};

export type ExpressionConfig = ValueConfig | FunctionConfig | ReferenceConfig;

export type ExecutableConfig = ActionConfig | BlockConfig | ControlConfig;

export type LogicForgeConfig =
  | ProcessConfig
  | ExecutableConfig
  | ExpressionConfig
  | ReferenceConfig
  | VariableConfig;
