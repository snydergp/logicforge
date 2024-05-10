/*
 * Content is an abstraction for storing the state of process data being viewed and edited. It is designed to break the
 * process tree-structure into doubly-linked parent/child nodes with unique (transient) keys for the purpose of
 * flattening the structure stored in Redux.
 */

import { CallableSpec, ControlType } from './specification';
import { ValidationError } from './validation';
import { TypeIntersection } from './types';

export type ArgumentName = string;
export type ContentKey = string;

export enum ContentType {
  PROCESS = 'PROCESS',
  BLOCK = 'BLOCK',
  CONTROL = 'CONTROL',
  ACTION = 'ACTION',
  FUNCTION = 'FUNCTION',
  ARGUMENT = 'ARGUMENT',
  VALUE = 'VALUE',
  REFERENCE = 'REFERENCE',
  VARIABLE = 'VARIABLE',
}

export type ContentStore = {
  count: number;
  indexedContent: IndexedContent;
  rootConfigKey: string;
};

export type IndexedContent = { [key: ContentKey]: Content };

export type Content = {
  key: ContentKey;
  differentiator: ContentType;
  parentKey: ContentKey | null;
  errors: ValidationError[];
};

export type ExpressionInfo = {
  type: TypeIntersection;
  multi: boolean;
  optional: boolean;
};

export type ExpressionContent = Content &
  ExpressionInfo & {
    differentiator:
      | ContentType.PROCESS
      | ContentType.ACTION
      | ContentType.FUNCTION
      | ContentType.REFERENCE
      | ContentType.VALUE
      | ContentType.VARIABLE;
  };

export type ExecutableContent = Content & {
  differentiator: ContentType.ACTION | ContentType.BLOCK | ContentType.CONTROL;
};

export type NodeContent = {
  childKeyMap: { [key: ArgumentName]: ContentKey };
} & Content;

export type ListContent = {
  childKeys: ContentKey[];
} & Content;

export type ProcessContent = NodeContent &
  ExpressionContent & {
    differentiator: ContentType.PROCESS;
    name: string;
    rootBlockKey?: ContentKey;
    spec: CallableSpec;
    inputVariableKeys: ContentKey[];
    externalId: any;
  };

export type ControlContent = ListContent &
  NodeContent & {
    differentiator: ContentType.CONTROL;
    controlType: ControlType;
  };

export type ConditionalContent = ControlContent & {
  differentiator: ContentType.CONTROL;
  controlType: ControlType.CONDITIONAL;
};

export type BlockContent = ListContent & {
  differentiator: ContentType.BLOCK;
};

export type ActionContent = NodeContent &
  ExpressionContent & {
    differentiator: ContentType.ACTION;
    name: string;
    variableContentKey?: ContentKey;
  };

export type FunctionContent = NodeContent &
  ExpressionContent & {
    differentiator: ContentType.FUNCTION;
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
  differentiator: ContentType.ARGUMENT;
  allowMulti: boolean;
  /** An exhaustive list of all allowable TypeIds, including subtypes */
  allowedType: TypeIntersection;
  /** The mapped parameters declared type (generally just a single TypeId, but not necessarily) */
  declaredType: TypeIntersection;
  /** The potential return type(s), given the argument's current configuration */
  calculatedType: TypeIntersection;
  propagateTypeChanges: boolean;
};

export type ValueContent = Content &
  ExpressionContent & {
    differentiator: ContentType.VALUE;
    value: string;
    availableFunctionIds: string[];
    availableVariables: { key: ContentKey; conditional: boolean }[];
  };

export type ReferenceContent = Content &
  ExpressionContent & {
    differentiator: ContentType.REFERENCE;
    variableKey: ContentKey;
    path: string[];
  };

export type VariableContent = Content &
  ExpressionContent & {
    differentiator: ContentType.VARIABLE;
    title?: string;
    description?: string;
    translationKey?: string;
    basePath?: string;
    optional: boolean;
    initial: boolean;
    referenceKeys: ContentKey[];
  };
