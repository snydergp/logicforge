/*
 * Configs represent the serialization structure for loading/storing process data.
 */

import { ControlType } from './specification';

export enum ExecutableType {
  ACTION = 'ACTION',
  CONTROL_STATEMENT = 'CONTROL_STATEMENT',
}

export enum ExpressionType {
  FUNCTION = 'FUNCTION',
  REFERENCE = 'REFERENCE',
  VALUE = 'VALUE',
}

export type FunctionConfig = {
  differentiator: ExpressionType.FUNCTION;
  name: string;
  arguments: { [key: string]: ExpressionConfig[] };
};

export type ReferenceConfig = {
  differentiator: ExpressionType.REFERENCE;
  coordinates: readonly number[];
  path: string[];
};

export type ValueConfig = {
  differentiator: ExpressionType.VALUE;
  value: string;
  typeId: string;
};

export type ExpressionConfig = FunctionConfig | ReferenceConfig | ValueConfig;

export type ActionConfig = {
  differentiator: ExecutableType.ACTION;
  name: string;
  arguments: { [key: string]: ExpressionConfig[] };
  output?: VariableConfig;
};

export type ControlConfig = {
  differentiator: ExecutableType.CONTROL_STATEMENT;
  controlType: ControlType;
  blocks: BlockConfig[];
};

export type ExecutableConfig = ActionConfig | ControlConfig;

export type ConditionalConfig = ControlConfig & {
  controlType: ControlType.CONDITIONAL;
  condition: ExpressionConfig;
};

export type BlockConfig = {
  executables: ExecutableConfig[];
};

export type ProcessConfig = {
  name: string;
  rootBlock: BlockConfig;
  returnExpression?: ExpressionConfig[];
  /**
   * Extra data sent by the server to identify the config. This is not used by the front end, but
   * will be held with the process model and returned to the server when updates are made
   * */
  externalId: any;
};

export type VariableConfig = {
  title?: string;
  description?: string;
  translationKey?: string;
};

export type LogicForgeConfig =
  | ProcessConfig
  | ExecutableConfig
  | ExpressionConfig
  | ReferenceConfig
  | VariableConfig;
