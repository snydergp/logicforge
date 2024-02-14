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
  arguments: { [key: string]: InputConfig[] };
};

export type VariableConfig = {
  type: ConfigType.VARIABLE;
  index: number;
  path: string[];
};

export type ActionConfig = {
  type: ConfigType.ACTION;
  name: string;
  actionArguments: { [key: string]: ActionConfig[] };
  inputArguments: { [key: string]: InputConfig[] };
};

export type ProcessConfig = {
  type: ConfigType.PROCESS;
  name: string;
  actions: ActionConfig[];
};

export type InputConfig = ValueConfig | FunctionConfig | VariableConfig;

export type ArgumentConfig = InputConfig | ActionConfig;

export type ParentConfig = ProcessConfig | ActionConfig | FunctionConfig;

export type LogicForgeConfig = ProcessConfig | ActionConfig | FunctionConfig | ValueConfig;
