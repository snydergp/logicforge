/*
 * Configs represent the serialization structure for loading/storing process data.
 */

export enum ConfigType {
  PROCESS = 'process',
  ACTION = 'action',
  VALUE = 'value',
  VARIABLE = 'variable',
  FUNCTION = 'function',
}

export type ValueConfig = {
  type: ConfigType.VALUE;
  value: string;
};

export type FunctionConfig = {
  type: ConfigType.FUNCTION;
  name: string;
  inputs: { [key: string]: ExpressionConfig[] };
};

export type VariableConfig = {
  type: ConfigType.VARIABLE;
  index: number;
  path: string[];
};

export type ActionConfig = {
  type: ConfigType.ACTION;
  name: string;
  actions?: ActionConfig[];
  inputs: { [key: string]: ExpressionConfig[] };
};

export type ProcessConfig = {
  type: ConfigType.PROCESS;
  name: string;
  actions: ActionConfig[];
};

export type ExpressionConfig = ValueConfig | FunctionConfig | VariableConfig;

export type LogicForgeConfig = ProcessConfig | ActionConfig | FunctionConfig | ValueConfig;
