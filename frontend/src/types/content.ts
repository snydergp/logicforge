/*
 * Content is an abstraction for storing the state of process data being viewed and edited. It is designed to break the
 * process tree-structure into doubly-linked parent/child nodes with unique (transient) keys for the purpose of
 * flattening the structure stored in Redux.
 */

import { ActionSpec, ControlType, FunctionSpec, ProcessSpec } from './specification';
import { ValidationError } from './validation';

export type ArgumentName = string;
export type ContentKey = string;
export type TypeId = string;

export enum ContentType {
  PROCESS = 'PROCESS',
  BLOCK = 'BLOCK',
  CONTROL = 'CONTROL',
  ACTION = 'ACTION',
  FUNCTION = 'FUNCTION',
  ARGUMENT = 'ARGUMENT',
  VALUE = 'VALUE',
  REFERENCE = 'REFERENCE',
  CONDITIONAL_REFERENCE = 'CONDITIONAL_REFERENCE',
  VARIABLE = 'VARIABLE',
}

export type ContentStore = {
  count: number;
  data: { [key: ContentKey]: Content };
  rootConfigKey: string;
};

export type Content = {
  key: ContentKey;
  type: ContentType;
  parentKey: ContentKey | null;
  errors: ValidationError[];
};

export type ExpressionContent = Content & {
  type:
    | ContentType.PROCESS
    | ContentType.ACTION
    | ContentType.FUNCTION
    | ContentType.REFERENCE
    | ContentType.CONDITIONAL_REFERENCE
    | ContentType.VALUE
    | ContentType.VARIABLE;
  multi: boolean;
  typeId: TypeId | null;
};

export type ExecutableContent = Content & {
  type: ContentType.ACTION | ContentType.BLOCK | ContentType.CONTROL;
};

export type NodeContent = {
  childKeyMap: { [key: ArgumentName]: ContentKey };
} & Content;

export type ListContent = {
  childKeys: ContentKey[];
} & Content;

export type ProcessContent = Content &
  ExpressionContent & {
    type: ContentType.PROCESS;
    name: string;
    rootBlockKey?: ContentKey;
    returnArgumentKey?: ContentKey;
    spec: ProcessSpec;
    inputVariableKeys: ContentKey[];
  };

export type ControlContent = ListContent &
  NodeContent & {
    type: ContentType.CONTROL;
    controlType: ControlType;
  };

export type ConditionalContent = ControlContent & {
  type: ContentType.CONTROL;
  controlType: ControlType.CONDITIONAL;
};

export type BlockContent = ListContent & {
  type: ContentType.BLOCK;
};

export type ActionContent = NodeContent &
  ExpressionContent & {
    type: ContentType.ACTION;
    name: string;
    spec: ActionSpec;
    variableContentKey?: ContentKey;
  };

export type FunctionContent = NodeContent &
  ExpressionContent & {
    type: ContentType.FUNCTION;
    spec: FunctionSpec;
    name: string;
  };

/**
 * Arguments represent an input to a function, action, or control. Each argument has a type, based
 * on the input's declared type. Expressions provided to the argument must satisfy that type
 * requirement with the declared type, a subtype, or a type convertable to the declared type.
 * Arguments will only allow multiple children when the "allowMulti" flag is true.
 *
 * In addition to the declared type, this model tracks the actual type supplied by child
 * expressions to allow parent actions/functions to dynamically set their output types.
 */
export type ArgumentContent = ListContent & {
  type: ContentType.ARGUMENT;
  allowMulti: boolean;
  allowedTypeIds: TypeId[];
  declaredTypeId: TypeId;
  calculatedTypeId: TypeId | null;
  propagateTypeChanges: boolean;
};

export type ValueContent = Content &
  ExpressionContent & {
    type: ContentType.VALUE;
    value: string;
    availableFunctionIds: string[];
    availableVariables: { key: ContentKey; conditional: boolean }[];
  };

export type ReferenceContent = Content &
  ExpressionContent & {
    type: ContentType.REFERENCE;
    referenceKey: ContentKey;
    path: string[];
  };

export type ConditionalReferenceContent = ListContent &
  ExpressionContent & {
    type: ContentType.CONDITIONAL_REFERENCE;
    /** Only undefined during construction */
    expressionKey?: ContentKey;
    /** Only undefined during construction */
    fallbackKey?: ContentKey;
  };

export type VariableContent = Content &
  ExpressionContent & {
    type: ContentType.VARIABLE;
    title: string;
    description: string;
    basePath?: string;
    optional: boolean;
    referenceKeys: ContentKey[];
  };

export function isExecutable(type: ContentType) {
  return type === ContentType.CONTROL || type === ContentType.BLOCK || type === ContentType.ACTION;
}
