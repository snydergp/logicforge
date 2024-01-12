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

export const PROCESS_DEFAULT_ACTIONS = 'actions';

export type ValueConfig = {
  type: ConfigType.VALUE;
  value: string;
};

export type FunctionConfig = {
  type: ConfigType.FUNCTION;
  name: string;
  arguments: { [key: string]: Array<InputConfig> };
};

export type ActionConfig = {
  type: ConfigType.ACTION;
  name: string;
  arguments: { [key: string]: Array<InputConfig | ActionConfig> };
};

export type ProcessConfig = {
  type: ConfigType.PROCESS;
  name: string;
  arguments: { [key: string]: Array<ActionConfig> };
};

export type InputConfig = ValueConfig | FunctionConfig;

export type ArgumentConfig = InputConfig | ActionConfig;

export type ParentConfig = ProcessConfig | ActionConfig | FunctionConfig;

export type LogicForgeConfig = ProcessConfig | ActionConfig | FunctionConfig | ValueConfig;
