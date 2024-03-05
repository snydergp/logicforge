/*
 * Content is an abstraction for storing the state of process data being viewed and edited. It is designed to break the
 * process tree-structure into doubly-linked parent/child nodes with unique (transient) keys for the purpose of
 * flattening the structure stored in Redux.
 */

import {ActionSpec, ControlType, FunctionSpec, InputSpec} from './specification';

export enum ContentType {
  PROCESS = 'PROCESS',
  BLOCK = 'BLOCK',
  CONTROL = 'CONTROL',
  ACTION = 'ACTION',
  FUNCTION = 'FUNCTION',
  EXPRESSION_LIST = 'EXPRESSION_LIST',
  VALUE = 'VALUE',
  REFERENCE = 'REFERENCE',
  CONDITIONAL_REFERENCE = 'CONDITIONAL_REFERENCE',
  VARIABLE = 'VARIABLE',
}

export type ContentStore = {
  count: number;
  data: { [key: string]: Content };
  rootConfigKey?: string;
};

export type Content = {
  key: string;
  type: ContentType;
  parentKey?: string;
};

export type NodeContent = {
  childKeys: { [key: string]: string };
} & Content;

export type ListContent = {
  childKeys: string[];
} & Content;

export type ProcessContent = Content & {
  type: ContentType.PROCESS;
  name: string;
  rootBlockKey: string;
  returnExpressionKey?: string;
};

export type ControlContent = ListContent & {
  type: ContentType.CONTROL;
  controlType: ControlType;
};

export type ConditionalContent = ControlContent & {
  type: ContentType.CONTROL;
  controlType: ControlType.CONDITIONAL;
  conditionalExpressionKey: string;
};

export type BlockContent = ListContent & {
  type: ContentType.BLOCK;
};

export type ActionContent = NodeContent & {
  type: ContentType.ACTION;
  name: string;
  spec: ActionSpec;
  variableContentKey?: string;
};

export type FunctionContent = NodeContent & {
  type: ContentType.FUNCTION;
  spec: FunctionSpec;
  name: string;
};

export type InputsContent = ListContent & {
  type: ContentType.EXPRESSION_LIST;
  name: string;
  spec: InputSpec;
};

export type ValueContent = Content & {
  type: ContentType.VALUE;
  value: string;
};

export type ReferenceContent = Content & {
  type: ContentType.REFERENCE;
  referenceKey: string;
  path: string[];
};

export type ConditionalReferenceContent = ListContent & {
  type: ContentType.CONDITIONAL_REFERENCE;
  expressionKey: string;
  fallbackKey: string;
};

export type VariableContent = Content & {
  type: ContentType.VARIABLE;
  title: string;
  description?: string;
};

export function isExecutable(type: ContentType) {
  return type === ContentType.CONTROL || type === ContentType.BLOCK || type === ContentType.ACTION;
}
