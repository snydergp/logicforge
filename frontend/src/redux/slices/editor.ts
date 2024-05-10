import { AnyAction, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreStructure } from '../types';
import {
  ActionConfig,
  ActionContent,
  ArgumentContent,
  BlockConfig,
  BlockContent,
  CallableSpec,
  CONDITIONAL_CONDITION_PROP,
  CONDITIONAL_CONTROL_SPEC,
  ConditionalConfig,
  ConditionalContent,
  ConfigType,
  Content,
  ContentKey,
  ContentStore,
  ContentType,
  ControlConfig,
  ControlContent,
  ControlType,
  EngineSpec,
  ErrorCode,
  ErrorLevel,
  ExecutableConfig,
  ExecutableContent,
  ExpressionConfig,
  ExpressionContent,
  ExpressionInfo,
  ExpressionSpec,
  FunctionConfig,
  FunctionContent,
  IndexedContent,
  InputSpec,
  invalidReference,
  ListContent,
  LogicForgeConfig,
  PROCESS_RETURN_PROP,
  ProcessConfig,
  ProcessContent,
  ReferenceConfig,
  ReferenceContent,
  TypeId,
  TypeIntersection,
  TypeSystem,
  unsatisfiedInputTypeMismatch,
  validateValue,
  ValidationError,
  ValueConfig,
  ValueContent,
  VariableConfig,
  VariableContent,
  VOID_TYPE,
} from '../../types';
import {
  areCoordinatesPredecessor,
  Coordinates,
  doesTypeMatchRequirements,
  expandType,
  generateTypeSystem,
  getCoordinatesSharedAncestor,
  nextKey,
  recurseDown,
  recurseUp,
  resolveContent,
  typeEquals,
  typeIntersection,
} from '../../util';
import { WellKnownType } from '../../constant/well-known-type';
import { MetadataProperties } from '../../constant/metadata-properties';

export type EditorState = {
  selection: string;
  engineSpec: EngineSpec;
  contentStore: ContentStore;
  typeSystem: TypeSystem;
};

const frameEditorSlice = createSlice({
  name: 'LOGICFORGE_FRAME_EDITOR',
  initialState: {} as EditorState,
  reducers: {
    initEditor: {
      reducer(state, action: PayloadAction<LogicForgeConfig, string, { engineSpec: EngineSpec }>) {
        const config = action.payload;
        const { engineSpec } = action.meta;
        const contentStore: ContentStore = {
          count: 0,
          indexedContent: {},
          rootConfigKey: '',
        };
        const typeSystem = generateTypeSystem(engineSpec.types);
        const initialState: EditorState = { engineSpec, contentStore, typeSystem, selection: '' };
        loadRootContent(config, initialState);
        initialState.selection = contentStore.rootConfigKey;
        return initialState;
      },
      prepare(payload: ProcessConfig, engineSpec: EngineSpec) {
        return { payload, meta: { engineSpec } };
      },
    },
    setSelection: {
      reducer(state, action: PayloadAction<string>) {
        const key = action.payload;
        const { contentStore } = state;
        const contentToSelect = contentStore.indexedContent[key];
        // verify that the key is valid before changing the selection
        if (contentToSelect !== undefined) {
          state.selection = key;
        }
        return state;
      },
      prepare(payload: string) {
        return { payload };
      },
    },
    convertValueToFunction: {
      reducer(state, action: PayloadAction<string, string, { functionName: string }>) {
        const key = action.payload;
        const { functionName } = action.meta;
        doConvertValueToFunction(key, functionName, state);
        return state;
      },
      prepare(key: string, functionName: string) {
        return { payload: key, meta: { functionName } };
      },
    },
    convertValueToReference: {
      reducer(
        state,
        action: PayloadAction<
          string,
          string,
          {
            variableKey: string;
            path?: string;
          }
        >,
      ) {
        const { variableKey, path } = action.meta;
        const key = action.payload;
        doConvertValueToReference(key, variableKey, path, state);
        return state;
      },
      prepare(key: string, variableKey: string, path?: string) {
        return { payload: key, meta: { variableKey, path } };
      },
    },
    addInputValue: {
      reducer(state, action: PayloadAction<string>) {
        const parentKey = action.payload;
        doAddInputValue(parentKey, '', state);
        return state;
      },
      prepare(payload: string) {
        return { payload };
      },
    },
    addExecutable: {
      reducer(
        state,
        action: PayloadAction<
          string,
          string,
          {
            name: string;
            differentiator: ContentType.CONTROL | ContentType.ACTION;
          }
        >,
      ) {
        const name = action.meta.name;
        const type = action.meta.differentiator;
        const parentKey = action.payload;
        const { engineSpec } = state;
        let config;
        if (type === ContentType.ACTION) {
          const actionSpec = engineSpec.actions[name];
          config = newActionConfigForSpec(name, actionSpec);
        } else {
          config = newConditionalConfig();
        }
        state.selection = addNewExecutable(parentKey, config, state);
        return state;
      },
      prepare(
        payload: string,
        name: string,
        differentiator: ContentType.CONTROL | ContentType.ACTION,
      ) {
        return { payload, meta: { name, differentiator } };
      },
    },
    reorderInput: {
      reducer(
        state,
        action: PayloadAction<string, string, { oldIndex: number; newIndex: number }>,
      ) {
        const parentKey = action.payload;
        const contentStore = state.contentStore;
        reorderList(
          contentStore.indexedContent,
          parentKey,
          action.meta.oldIndex,
          action.meta.newIndex,
        );
        return state;
      },
      prepare(payload: string, oldIndex: number, newIndex: number) {
        return { payload, meta: { oldIndex, newIndex } };
      },
    },
    deleteItem: {
      reducer(state, action: PayloadAction<string>) {
        const keyToDelete = action.payload;
        doDeleteItem(keyToDelete, state);
        return state;
      },
      prepare(payload: string) {
        return { payload };
      },
    },
    updateValue: {
      reducer(state, action: PayloadAction<string, string, { newValue: string }>) {
        const { newValue } = action.meta;
        const key = action.payload;
        doUpdateValue(newValue, key, state);
        return state;
      },
      prepare(key: string, newValue: string) {
        return { payload: key, meta: { newValue } };
      },
    },
    updateValueType: {
      reducer(state, action: PayloadAction<string, string, { newTypeId: string }>) {
        const { newTypeId } = action.meta;
        const key = action.payload;
        doUpdateValueType(newTypeId, key, state);
        return state;
      },
      prepare(key: string, newTypeId: string) {
        return { payload: key, meta: { newTypeId } };
      },
    },
    updateReferencePath: {
      reducer(state, action: PayloadAction<string, string, { newPath: string[] }>) {
        const { newPath } = action.meta;
        const key = action.payload;
        doUpdateReferencePath(newPath, key, state);
        return state;
      },
      prepare(key: string, newPath: string[]) {
        return { payload: key, meta: { newPath } };
      },
    },
    moveExecutable: {
      reducer(
        state,
        action: PayloadAction<
          string,
          string,
          {
            newParentKey: string;
            newIndex: number;
          }
        >,
      ) {
        const { newIndex, newParentKey } = action.meta;
        const key = action.payload;
        doMoveExecutable(key, newParentKey, newIndex, state);
        return state;
      },
      prepare(key: string, newParentKey: string, newIndex: number) {
        return { payload: key, meta: { newParentKey, newIndex } };
      },
    },
    updateVariable: {
      reducer(
        state,
        action: PayloadAction<
          string,
          string,
          {
            title: string;
            description: string;
          }
        >,
      ) {
        const { title, description } = action.meta;
        const key = action.payload;
        doUpdateVariable(key, title, description, state);
        return state;
      },
      prepare(key: string, title: string, description: string) {
        return { payload: key, meta: { title, description } };
      },
    },
  },
});

export function editorsGroupBy(action: AnyAction) {
  if (action.type === updateValue.type) {
    const contentKey = (action as { [key: string]: string })['payload'];
    return `${updateValue.type}:${contentKey}`;
  } else if (action.type === setSelection.type) {
    return `${setSelection.type}`;
  }
  return null;
}

export const selectEditorSelection = (state: StoreStructure) => {
  return resolveCurrentSlice(state).selection;
};

/**
 * Internal-only selector used for creating memoizable composite selectors
 */
const selectContentStore = (state: StoreStructure) => {
  return resolveCurrentSlice(state).contentStore;
};

export const selectSelectedSubtree = createSelector(
  [selectEditorSelection, selectContentStore],
  (selection, contentStore): Content[] => {
    if (selection !== undefined && contentStore !== undefined) {
      return getContentAndAncestors(contentStore, selection);
    }
    return [];
  },
);

export const selectContentByKey = (key: ContentKey) => (state: StoreStructure) => {
  const contentStore = resolveCurrentSlice(state).contentStore;
  if (contentStore === undefined) {
    throw new Error('Illegal state: content store is not defined');
  }
  return contentStore.indexedContent[key];
};

export const selectIsInSelectedPath = (key: ContentKey) => (state: StoreStructure) => {
  const slice = resolveCurrentSlice(state);
  const contentStore = slice.contentStore;
  const selection = slice.selection;
  if (contentStore === undefined) {
    throw new Error('Illegal state: content store is not defined');
  }
  if (selection === undefined) {
    throw new Error('Illegal state: selection is not defined');
  }
  let selected = false;
  recurseUp(
    contentStore.indexedContent,
    (content) => {
      if (content.key === key) {
        selected = true;
      }
    },
    selection,
  );
  return selected;
};

export const selectContent = (state: StoreStructure) => {
  const contentStore = resolveCurrentSlice(state).contentStore;
  if (contentStore === undefined) {
    throw new Error('Illegal state: content store is not defined');
  }
  return contentStore.indexedContent;
};

export const selectEngineSpec = (state: StoreStructure) => {
  const engineSpec = resolveCurrentSlice(state).engineSpec;
  if (engineSpec === undefined) {
    throw new Error('Illegal state: engine spec is not defined');
  }
  return engineSpec;
};

export const selectFunctionSpec = (functionName: string) => (state: StoreStructure) => {
  const engineSpec = resolveCurrentSlice(state).engineSpec;
  if (engineSpec === undefined) {
    throw new Error('Illegal state: engine spec is not defined');
  }
  return engineSpec.functions[functionName];
};

export const selectAvailableVariables = (key: string) => (state: StoreStructure) => {
  return findAvailableVariables(key, resolveCurrentSlice(state));
};

export const selectReferenceExpressionType = (referenceKey: string) => (state: StoreStructure) => {
  const editorState = resolveCurrentSlice(state);
  const contentStore = editorState.contentStore;
  if (contentStore === undefined) {
    throw new Error('Illegal state: content store is not defined');
  }
  const referenceContent = resolveContent<ReferenceContent>(
    referenceKey,
    contentStore.indexedContent,
  );
  return resolveExpressionInfoForReference(
    referenceContent.variableKey,
    referenceContent.path,
    editorState,
  );
};

export const selectParameterSpecificationForKey = (key?: string) => (state: StoreStructure) => {
  if (key !== undefined) {
    const editorState = resolveCurrentSlice(state);
    if (editorState !== undefined) {
      return resolveParameterSpecForKey(key, editorState);
    }
  }
};

function removeChildKey(content: ListContent, key: string) {
  content.childKeys.splice(content.childKeys.indexOf(key), 1);
}

function addChildKey(content: ListContent, key: string, index: number) {
  const oldChildren = content.childKeys;
  content.childKeys = [...oldChildren.slice(0, index), ...[key], ...oldChildren.slice(index)];
}

function newActionConfigForSpec(actionName: string, spec: CallableSpec): ActionConfig {
  const inputArgumentConfigs: { [key: string]: ExpressionConfig[] } = {};
  Object.entries(spec.inputs).forEach(([key]) => {
    // NOTE: value types are only ever a single type ID, never an intersection. For now, callables
    //  should also always have a single discrete type, but this may need to be revisited if that
    //  changes
    const valueType = spec.output.type[0];
    inputArgumentConfigs[key] = [
      {
        differentiator: ConfigType.VALUE,
        value: '',
        typeId: valueType,
      },
    ];
  });

  return {
    differentiator: ConfigType.ACTION,
    name: actionName,
    arguments: inputArgumentConfigs,
  };
}

function newConditionalConfig(): ConditionalConfig {
  return {
    differentiator: ConfigType.CONTROL_STATEMENT,
    controlType: ControlType.CONDITIONAL,
    conditionalExpression: {
      differentiator: ConfigType.VALUE,
      value: '',
      typeId: 'boolean',
    },
    blocks: [
      {
        differentiator: ConfigType.BLOCK,
        executables: [],
      },
      {
        differentiator: ConfigType.BLOCK,
        executables: [],
      },
    ],
  };
}

function doDeleteItem(keyToDelete: string, state: EditorState) {
  const { contentStore, selection } = state;

  const selectedSubtree = getContentAndAncestors(contentStore, selection);
  const selectedContent = selectedSubtree.find((content) => content.key === keyToDelete);
  const selectedContentParentKey = selectedContent?.parentKey;
  if (selectedContent !== undefined && selectedContentParentKey !== undefined) {
    // If the content being deleted is also currently selected, we move the selection up to its parent node
    state.selection = selectedContentParentKey as string;
  }
  const contentToDelete = contentStore.indexedContent[keyToDelete];
  deleteListItem(keyToDelete, contentStore);
  if (
    contentToDelete.differentiator !== ContentType.ACTION &&
    contentToDelete.differentiator !== ContentType.CONTROL &&
    typeof contentToDelete.parentKey === 'string'
  ) {
    const parentArgContent = resolveContent<ArgumentContent>(
      contentToDelete.parentKey,
      contentStore.indexedContent,
    );
    const expressionSpec = resolveParameterSpec(parentArgContent, state);
    // when deleting a non-multi argument expression, replace it with a new empty value
    if (!expressionSpec.multi) {
      const replacementType = parentArgContent.declaredType[0];
      const replacementValue = constructValue(
        {
          differentiator: ConfigType.VALUE,
          value: '',
          typeId: replacementType,
        },
        contentToDelete.parentKey,
        state,
      );
      parentArgContent.childKeys.push(replacementValue.key);
    }
  }
}

function doAddInputValue(parentKey: string, value: string, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const indexedContent = contentStore.indexedContent;
  const argumentContent = resolveContent<ArgumentContent>(parentKey, indexedContent);
  const { allowMulti, declaredType } = argumentContent;
  let type = declaredType;
  if (typeEquals(type, [WellKnownType.OBJECT])) {
    // default new values of unspecified type to string input mode
    type = [WellKnownType.STRING];
  }
  const availableFunctionIds = Object.keys(
    findFunctionsMatchingTypeConstraints(type, allowMulti, state),
  );
  const availableVariables = findAvailableVariables(parentKey, state).map((variable) => {
    return { key: variable.key, conditional: variable.conditional };
  });

  const valueContent = {
    differentiator: ContentType.VALUE,
    key: nextKey(contentStore),
    parentKey,
    multi: false,
    value,
    type: type,
    availableFunctionIds,
    availableVariables,
    errors: validateValue(value, type, engineSpec),
  } as ValueContent;
  indexedContent[valueContent.key] = valueContent;

  const parentContent = resolveContent<ArgumentContent>(parentKey, indexedContent);
  parentContent.childKeys = [...parentContent.childKeys, valueContent.key];

  return valueContent;
}

function doConvertValueToReference(
  valueKey: ContentKey,
  variableKey: ContentKey,
  path: string | undefined,
  state: EditorState,
) {
  const { contentStore, selection, typeSystem } = state;
  let indexedContent = contentStore.indexedContent;
  const existingValueContent = resolveContent<ValueContent>(valueKey, indexedContent);
  const parentArgContent = resolveContent<ArgumentContent>(
    existingValueContent.parentKey as string,
    indexedContent,
  );
  const variableContent = resolveContent<VariableContent>(variableKey, indexedContent);
  const referenceKey = nextKey(contentStore);
  const referencePath = [...(path !== undefined ? [path] : [])];
  const { type, multi } = resolveExpressionInfoForReference(variableKey, referencePath, state);
  parentArgContent.calculatedType = typeIntersection(parentArgContent.calculatedType, type);

  const errors: ValidationError[] = [];

  indexedContent[referenceKey] = {
    key: referenceKey,
    differentiator: ContentType.REFERENCE,
    parentKey: existingValueContent.parentKey,
    variableKey,
    path: referencePath,
    errors, // TODO validate initial state
    type: type,
    multi,
  } as ReferenceContent;
  const oldIndex = parentArgContent.childKeys.indexOf(valueKey);
  parentArgContent.childKeys[oldIndex] = referenceKey;
  recursiveDelete(contentStore, valueKey);
  variableContent.referenceKeys.push(referenceKey);
  if (selection === valueKey) {
    state.selection = referenceKey;
  }

  // validate (must happen after reference  content is stored)
  if (!doesTypeMatchRequirements(type, parentArgContent.declaredType, typeSystem)) {
    errors.push(unsatisfiedInputTypeMismatch(parentArgContent.declaredType, type));
  }
  errors.push(...validateReference(referenceKey, indexedContent));

  doPropagateTypeChanges(referenceKey, state);
}

function doConvertValueToFunction(valueKey: ContentKey, functionName: string, state: EditorState) {
  const { engineSpec, contentStore, selection, typeSystem } = state;

  const existingValueContent = resolveContent<ValueContent>(valueKey, contentStore.indexedContent);
  const existingArgContent = resolveContent<ArgumentContent>(
    existingValueContent.parentKey as string,
    contentStore.indexedContent,
  );
  const existingIndex = existingArgContent.childKeys.indexOf(valueKey);

  const functionSpec = engineSpec.functions[functionName];
  const functionKey = nextKey(contentStore);
  const functionContent: FunctionContent = {
    key: functionKey,
    differentiator: ContentType.FUNCTION,
    parentKey: existingArgContent.key,
    name: functionName,
    type: functionSpec.output.type,
    multi: functionSpec.output.multi,
    optional: false,
    errors: [],
    childKeyMap: {},
  };
  contentStore.indexedContent[functionKey] = functionContent;

  existingArgContent.childKeys[existingIndex] = functionKey;

  Object.entries(functionSpec.inputs).forEach(([inputName, inputSpec]) => {
    const argKey = nextKey(contentStore);
    const type = inputSpec.type;
    const propagateTypeChanges = inputSpec.metadata.hasOwnProperty(
      MetadataProperties.INFLUENCES_RETURN_TYPE,
    );
    contentStore.indexedContent[argKey] = {
      key: argKey,
      differentiator: ContentType.ARGUMENT,
      parentKey: functionKey,
      errors: [] as ValidationError[],
      allowMulti: inputSpec.multi,
      declaredType: type,
      calculatedType: type,
      propagateTypeChanges,
      allowedType: expandType(type, typeSystem),
      childKeys: [] as ContentKey[],
    } as ArgumentContent;
    functionContent.childKeyMap[inputName] = argKey;

    doAddInputValue(argKey, '', state);
  });

  if (selection === valueKey) {
    state.selection = functionKey;
  }

  doPropagateTypeChanges(functionKey, state);
}

function doPropagateTypeChanges(expressionKey: string, state: EditorState) {
  const { contentStore, typeSystem } = state;
  let indexedContent = contentStore.indexedContent;
  const updatedExpression = resolveContent<ExpressionContent>(expressionKey, indexedContent);
  const { multi } = updatedExpression;
  const parentArgument = resolveContent<ArgumentContent>(
    updatedExpression.parentKey as string,
    indexedContent,
  );
  const calculatedType = parentArgument.childKeys
    .map((key) => {
      const childExpression = resolveContent<ExpressionContent>(key, indexedContent);
      return childExpression.type;
    })
    .reduce((previous, current) => {
      return typeIntersection(previous, current);
    }, []);
  parentArgument.calculatedType = calculatedType;

  const parent = resolveContent<FunctionContent | ActionContent>(
    parentArgument.parentKey as string,
    indexedContent,
  );
  if (
    !doesTypeMatchRequirements(calculatedType, parentArgument.allowedType, typeSystem) ||
    (updatedExpression.multi && !parentArgument.allowMulti)
  ) {
    ensureErrorByCode(parent.errors, {
      code: ErrorCode.UNSATISFIED_INPUT_TYPE_MISMATCH,
      level: ErrorLevel.ERROR,
      data: {},
    });
  } else {
    removeErrorsByCode(parent.errors, ErrorCode.UNSATISFIED_INPUT_TYPE_MISMATCH);
    // continue propagation upward only if there are no errors
    if (parentArgument.propagateTypeChanges) {
      parent.type = calculatedType;
      parent.multi = multi;
      if (parent.differentiator === ContentType.FUNCTION) {
        doPropagateTypeChanges(parent.key, state);
      } else {
        const actionParent = parent as ActionContent;
        if (actionParent.variableContentKey !== undefined) {
          const variableContent = resolveContent<VariableContent>(
            actionParent.variableContentKey as string,
            indexedContent,
          );
          variableContent.type = calculatedType;
          variableContent.multi = multi;
          variableContent.referenceKeys.forEach((referenceKey: ContentKey) => {
            const referenceContent = resolveContent<ReferenceContent>(referenceKey, indexedContent);
            referenceContent.type = calculatedType;
            referenceContent.multi = multi;
            doPropagateTypeChanges(referenceKey, state);
          });
        }
      }
    }
  }
}

function doUpdateValue(value: string, key: string, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const valueContent = resolveContent<ValueContent>(key, contentStore.indexedContent);
  const { type, errors } = valueContent;
  valueContent.value = value;
  const newErrors = validateValue(value, type, engineSpec);
  // Replace any existing INVALID_VALUE errors with any new errors found
  removeErrorsByCode(errors, ErrorCode.INVALID_VALUE);
  errors.push(...newErrors);
}

function doUpdateValueType(newTypeId: TypeId, key: ContentKey, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const indexedContent = contentStore.indexedContent;
  const valueContent = resolveContent<ValueContent>(key, indexedContent);
  const argumentContent = resolveContent<ArgumentContent>(
    valueContent.parentKey as string,
    indexedContent,
  );
  const { value, errors } = valueContent;
  valueContent.type = [newTypeId];
  const newErrors = validateValue(value, valueContent.type, engineSpec);
  // Replace any existing INVALID_VALUE errors with any new errors found
  removeErrorsByCode(errors, ErrorCode.INVALID_VALUE);
  errors.push(...newErrors);
  // QUESTION: should functions ignore the selected type restriction?
  valueContent.availableFunctionIds = Object.keys(
    findFunctionsMatchingTypeConstraints(valueContent.type, argumentContent.allowMulti, state),
  );
  doPropagateTypeChanges(key, state);
}

function doUpdateReferencePath(newPath: string[], key: ContentKey, state: EditorState) {
  const { contentStore, typeSystem } = state;
  const indexedContent = contentStore.indexedContent;
  const referenceContent = resolveContent<ReferenceContent>(key, indexedContent);
  const { type, multi } = resolveExpressionInfoForReference(
    referenceContent.variableKey,
    newPath,
    state,
  );
  referenceContent.path = newPath;
  referenceContent.type = type;
  referenceContent.multi = multi;
  const parentArgContent = resolveContent<ArgumentContent>(
    referenceContent.parentKey as string,
    contentStore.indexedContent,
  );
  const { errors } = referenceContent;
  removeErrorsByCode(errors, ErrorCode.UNSATISFIED_INPUT_TYPE_MISMATCH);
  if (!doesTypeMatchRequirements(type, parentArgContent.declaredType, typeSystem)) {
    errors.push(unsatisfiedInputTypeMismatch(parentArgContent.declaredType, type));
  }
  doPropagateTypeChanges(key, state);
}

function doMoveExecutable(key: string, newParentKey: string, newIndex: number, state: EditorState) {
  const { contentStore } = state;
  const indexedContent = contentStore.indexedContent;
  const executableContent = resolveContent<ExecutableContent>(key, indexedContent);
  const oldParentKey = executableContent.parentKey as string;
  const oldParentBlock = resolveContent<BlockContent>(oldParentKey, indexedContent);

  // Update all content links
  removeChildKey(oldParentBlock, key);
  const newParentBlock =
    oldParentKey === newParentKey
      ? oldParentBlock
      : resolveContent<BlockContent>(newParentKey, indexedContent);
  addChildKey(newParentBlock, key, newIndex);
  executableContent.parentKey = newParentKey;

  function doRevalidateReferences(content: Content) {
    if (content.differentiator === ContentType.REFERENCE) {
      const contentKey = content.key;
      const errors = content.errors;
      removeErrorsByCode(errors, ErrorCode.INVALID_REFERENCE);
      removeErrorsByCode(errors, ErrorCode.UNCHECKED_REFERENCE);
      errors.push(...validateReference(contentKey, indexedContent));
    }
  }

  // Re-validate any references in the executables child content
  recurseDown(indexedContent, doRevalidateReferences, key);

  // If the executable sets a variable, re-validate any references to it
  if (executableContent.differentiator === ContentType.ACTION) {
    const actionContent = executableContent as ActionContent;
    if (actionContent.variableContentKey !== undefined) {
      const variableContent = resolveContent<VariableContent>(
        actionContent.variableContentKey,
        indexedContent,
      );
      for (const referenceKey of variableContent.referenceKeys) {
        const referenceContent = resolveContent<ReferenceContent>(referenceKey, indexedContent);
        doRevalidateReferences(referenceContent);
      }
    }
  }
}

function doUpdateVariable(key: string, title: string, description: string, state: EditorState) {
  const { contentStore } = state;
  const variableContent = resolveContent<VariableContent>(key, contentStore.indexedContent);
  variableContent.title = title;
  variableContent.description = description;
}

function removeErrorsByCode(errors: ValidationError[], errorCode: ErrorCode) {
  const reverseIndices = errors
    .map((error) => error.code)
    .map((code, index) => (errorCode === code ? index : -1))
    .filter((index) => index >= 0)
    .reverse();
  reverseIndices.forEach((index) => errors.splice(index, 1));
}

function ensureErrorByCode(errors: ValidationError[], error: ValidationError) {
  const foundError = errors.find((err) => err.code === error.code);
  if (foundError === undefined) {
    errors.push(error);
  }
}

function findFunctionsMatchingTypeConstraints(
  type: TypeIntersection,
  multi: boolean,
  state: EditorState,
) {
  const { engineSpec, typeSystem } = state;
  const matchingFunctions: { [key: string]: CallableSpec } = {};
  if (typeSystem !== undefined && engineSpec !== undefined) {
    Object.entries(engineSpec.functions).forEach(([key, functionSpec]) => {
      const functionOutput = functionSpec.output;
      const functionOutputTypeId = functionOutput.type;
      // function output must be of the same type or able to be converted/coerced into the type
      if (doesTypeMatchRequirements(functionOutputTypeId, type, typeSystem)) {
        const functionOutputMultiple = functionOutput.multi;
        // functions with multi outputs are only allowed if the required type is multi itself
        if (multi || !functionOutputMultiple) {
          matchingFunctions[key] = functionSpec;
        }
      }
    });
  }
  return matchingFunctions;
}

export type VariableModel = VariableContent & {
  conditional: boolean;
};

function findAvailableVariables(key: string, state: EditorState): VariableModel[] {
  const { contentStore } = state;
  const indexedContent = contentStore.indexedContent;
  const variables: VariableModel[] = [];

  let rootActionContent: ExecutableContent | undefined;
  recurseUp(
    indexedContent,
    (content) => {
      if (
        (content.differentiator === ContentType.ACTION ||
          content.differentiator === ContentType.CONTROL) &&
        rootActionContent === undefined
      ) {
        rootActionContent = content as ExecutableContent;
      }
    },
    key,
  );

  const rootContent = resolveContent<ProcessContent>(
    contentStore.rootConfigKey as string,
    indexedContent,
  );
  for (let inputVariableKey of rootContent.inputVariableKeys) {
    const inputVariableContent = resolveContent<VariableContent>(inputVariableKey, indexedContent);
    variables.push({
      ...(inputVariableContent as VariableContent),
      conditional: false,
    });
  }

  const getActionVariable = (
    actionContent: ActionContent,
    contentStore: ContentStore,
    conditional: boolean,
  ): VariableModel | void => {
    if (actionContent.variableContentKey) {
      const variableContent = resolveContent<VariableContent>(
        actionContent.variableContentKey,
        contentStore.indexedContent,
      );
      return {
        ...variableContent,
        conditional,
      } as VariableModel;
    }
  };

  const collectControlVariables = (
    controlContent: ControlContent,
    contentStore: ContentStore,
  ): VariableModel[] => {
    const indexedContent = contentStore.indexedContent;
    if (controlContent.controlType !== ControlType.CONDITIONAL) {
      throw new Error(`Unknown control type: ${controlContent.controlType}`);
    }
    const conditionalContent = controlContent as ConditionalContent;
    const thenBlockContent = resolveContent<BlockContent>(
      conditionalContent.childKeys[0],
      indexedContent,
    );
    const elseBlockContent = resolveContent<BlockContent>(
      conditionalContent.childKeys[0],
      indexedContent,
    );
    const allChildKeys = [...thenBlockContent.childKeys, ...elseBlockContent.childKeys];
    return allChildKeys
      .map((key) => {
        const executableContent = resolveContent<ExecutableContent>(key, indexedContent);
        if (executableContent.differentiator === ContentType.ACTION) {
          const actionContent = executableContent as ActionContent;
          return getActionVariable(actionContent, contentStore, true);
        } else if (executableContent.differentiator === ContentType.CONTROL) {
          const controlContent = executableContent as ControlContent;
          if (controlContent.controlType !== ControlType.CONDITIONAL) {
            throw new Error(`Unsupported control type: ${controlContent.controlType}`);
          }
          return collectControlVariables(controlContent as ConditionalContent, contentStore);
        } else {
          throw new Error(`Unexpected child type: ${executableContent.differentiator}`);
        }
      })
      .filter((value) => value !== undefined)
      .flat() as VariableModel[];
  };

  /**
   * This code is written to handle the special case (rootActionContent === undefined) where we are
   * finding the available variables for the return expression, which is not a descendant of any
   * action, and which has access to every variable stored during the process execution
   */
  let childContent: ExecutableContent | undefined = rootActionContent;
  const processContent = resolveContent<ProcessContent>(contentStore.rootConfigKey, indexedContent);
  const blockKey =
    childContent !== undefined
      ? (childContent.parentKey as string)
      : (processContent.rootBlockKey as string);
  let parentBlock = resolveContent<BlockContent>(blockKey, indexedContent);
  let childIndex =
    childContent !== undefined
      ? parentBlock.childKeys.indexOf(childContent.key)
      : parentBlock.childKeys.length;
  while (true) {
    for (let i = childIndex - 1; i >= 0; i--) {
      const siblingContent = resolveContent<ExecutableContent>(
        parentBlock.childKeys[i],
        indexedContent,
      );
      if (siblingContent.differentiator === ContentType.ACTION) {
        const variableModel = getActionVariable(
          siblingContent as ActionContent,
          contentStore,
          false,
        );
        if (variableModel !== undefined) {
          variables.push(variableModel);
        }
      } else if (siblingContent.differentiator === ContentType.CONTROL) {
        const nestedVariables = collectControlVariables(
          siblingContent as ControlContent,
          contentStore,
        );
        variables.push(...nestedVariables);
      }
    }
    const grandparentContent = resolveContent<Content>(
      parentBlock.parentKey as string,
      indexedContent,
    );
    if (grandparentContent.differentiator === ContentType.CONTROL) {
      childContent = grandparentContent as ControlContent;
      parentBlock = resolveContent<BlockContent>(childContent.key, indexedContent);
      childIndex = parentBlock.childKeys.indexOf(childContent.key);
    } else {
      break;
    }
  }

  return variables;
}

export function loadRootContent(config: LogicForgeConfig, state: EditorState) {
  const { contentStore } = state;
  if (config.differentiator !== ConfigType.PROCESS) {
    throw new Error(`Illegal content root type: ${config.differentiator}`);
  }
  const rootState = constructProcess(config, state);
  contentStore.rootConfigKey = rootState.key;
}

function constructProcess(config: ProcessConfig, state: EditorState) {
  const { engineSpec, contentStore } = state;
  const processKey = nextKey(contentStore);
  const processName = config.name;
  const processSpec = engineSpec.processes[processName];

  const { type, multi } = processSpec.output || { type: VOID_TYPE, multi: false };

  // construct process
  const processContent: ProcessContent = {
    key: processKey,
    parentKey: null,
    differentiator: ContentType.PROCESS,
    name: processName,
    spec: processSpec,
    type,
    multi,
    optional: false,
    inputVariableKeys: [],
    childKeyMap: {},
    errors: [],
    externalId: config.externalId,
  };
  contentStore.indexedContent[processContent.key] = processContent;

  // set process as root content
  contentStore.rootConfigKey = processKey;

  // construct root block and link to process
  const rootBlockContent = constructBlock(config.rootBlock, processKey, state);
  rootBlockContent.parentKey = processKey;
  processContent.rootBlockKey = rootBlockContent.key;

  // if process has return, define the return arg content and link to process
  if (processSpec.output !== undefined) {
    const returnExpressionConfig = config.returnExpression || [
      {
        differentiator: ConfigType.VALUE,
        value: '',
      } as ValueConfig,
    ];
    const returnArgContent = constructArgument(
      returnExpressionConfig,
      processKey,
      processSpec.output,
      state,
    );
    returnArgContent.parentKey = processKey;
    processContent.childKeyMap[PROCESS_RETURN_PROP] = returnArgContent.key;
  }

  // construct input var content and link to process
  processContent.inputVariableKeys.push(
    ...Object.entries(processSpec.inputs).map(([name, variableSpec]) => {
      const variableConfig: VariableConfig = {
        differentiator: ConfigType.VARIABLE,
        translationKey: `processes.${processName}.inputs.${name}`,
      };
      const { type, multi } = variableSpec;
      const variableContent = constructVariable(
        variableConfig,
        processKey,
        type,
        multi,
        true,
        state,
      );
      variableContent.parentKey = processKey;
      variableContent.basePath = name;
      variableContent.optional = false; // TODO need to rethink how to handle optionality consistently
      return variableContent.key;
    }),
  );

  return processContent;
}

function constructArgument(
  configs: ExpressionConfig[],
  parentKey: string,
  spec: InputSpec | ExpressionSpec,
  state: EditorState,
) {
  const { contentStore, typeSystem } = state;
  const { type, multi } = spec;
  const metadata = (spec as InputSpec).metadata || {};
  const declaredType = type;
  const allowedType = expandType(type, typeSystem);
  const key = nextKey(contentStore);

  const calculatedType = typeEquals(type, [WellKnownType.OBJECT]) ? [WellKnownType.STRING] : type;

  const propagateTypeChanges = metadata.hasOwnProperty(MetadataProperties.INFLUENCES_RETURN_TYPE);

  // Construct arg content and add to store
  const argContent: ArgumentContent = {
    differentiator: ContentType.ARGUMENT,
    key,
    parentKey,
    allowMulti: multi,
    declaredType,
    allowedType,
    propagateTypeChanges,
    calculatedType, // overridden once children are constructed
    childKeys: [],
    errors: [],
  };
  contentStore.indexedContent[key] = argContent;

  // Construct child expression(s) and link to parent
  configs
    .map((config) => constructExpression(config, key, state))
    .forEach((content) => {
      argContent.childKeys.push(content.key);
    });

  return argContent;
}

function constructExpression(
  config: ExpressionConfig,
  parentKey: string,
  state: EditorState,
): ExpressionContent {
  switch (config.differentiator) {
    case ConfigType.VALUE:
      return constructValue(config as ValueConfig, parentKey, state);
    case ConfigType.FUNCTION:
      return constructFunction(config as FunctionConfig, parentKey, state);
    case ConfigType.REFERENCE:
      return constructReference(config as ReferenceConfig, parentKey, state);
  }
}

function constructBlock(config: BlockConfig, parentKey: string, state: EditorState) {
  const { contentStore } = state;
  const blockKey = nextKey(contentStore);

  // Construct content and add to store
  const blockContent: BlockContent = {
    differentiator: ContentType.BLOCK,
    key: blockKey,
    parentKey,
    childKeys: [],
    errors: [],
  };
  contentStore.indexedContent[blockKey] = blockContent;

  // Construct child executables and link to block
  config.executables.forEach((child) => {
    const childContent = constructExecutable(child, blockKey, state);
    childContent.parentKey = blockKey;
    blockContent.childKeys.push(childContent.key);
  });

  return blockContent;
}

function constructExecutable(
  config: ExecutableConfig,
  parentKey: string,
  state: EditorState,
): ExecutableContent {
  switch (config.differentiator) {
    case ConfigType.BLOCK:
      return constructBlock(config as BlockConfig, parentKey, state);
    case ConfigType.ACTION:
      return constructAction(config as ActionConfig, parentKey, state);
    case ConfigType.CONTROL_STATEMENT:
      return constructControl(config as ControlConfig, parentKey, state);
  }
}

function constructControl(config: ControlConfig, parentKey: string, state: EditorState) {
  let { contentStore } = state;
  const controlStatementKey = nextKey(contentStore);
  const type = config.controlType;
  if (type !== ControlType.CONDITIONAL) {
    throw new Error(`Unknown control statement type: ${type}`);
  }

  // Construct content and add to store
  const conditionalContent: ConditionalContent = {
    differentiator: ContentType.CONTROL,
    key: controlStatementKey,
    parentKey,
    childKeys: [],
    childKeyMap: {},
    controlType: ControlType.CONDITIONAL,
    errors: [],
  };
  contentStore.indexedContent[controlStatementKey] = conditionalContent;

  // Construct conditional arg and link to parent
  const conditionSpec = CONDITIONAL_CONTROL_SPEC.inputs.condition;
  const conditionalConfig = config as ConditionalConfig;
  const conditionalArgContent = constructArgument(
    [conditionalConfig.conditionalExpression],
    controlStatementKey,
    conditionSpec,
    state,
  );
  conditionalContent.childKeyMap['condition'] = conditionalArgContent.key;

  // Construct child blocks and link to parent
  const blockChildKeys = config.blocks.map((block) => {
    let content = constructBlock(block, controlStatementKey, state);
    return content.key;
  });
  conditionalContent.childKeys.push(...blockChildKeys);

  return conditionalContent;
}

function constructValue(config: ValueConfig, parentKey: string, state: EditorState): ValueContent {
  const { contentStore, engineSpec } = state;
  const indexedContent = contentStore.indexedContent;
  const { value } = config;
  const argContent = resolveContent<ArgumentContent>(parentKey, indexedContent);
  const type = typeEquals(argContent.declaredType, [WellKnownType.OBJECT])
    ? [WellKnownType.STRING]
    : argContent.declaredType;

  const errors: ValidationError[] = [];

  // Construct value content and add to store
  const valueContent = {
    differentiator: ContentType.VALUE,
    key: nextKey(contentStore),
    parentKey,
    type,
    multi: false,
    optional: false,
    value,
    availableFunctionIds: [],
    availableVariables: [],
    errors,
  } as ValueContent;
  contentStore.indexedContent[valueContent.key] = valueContent;

  // Find available functions and update content
  const availableFunctions = findFunctionsMatchingTypeConstraints(
    type,
    argContent.allowMulti,
    state,
  );
  valueContent.availableFunctionIds.push(...Object.keys(availableFunctions));

  // Find available variables and update content
  const availableVariables = findAvailableVariables(parentKey, state);
  valueContent.availableVariables.push(...availableVariables);

  // Validate value and update content
  valueContent.errors.push(...validateValue(value, type, engineSpec));

  return valueContent;
}

function constructAction(config: ActionConfig, parentKey: ContentKey, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const key = nextKey(contentStore);
  const name = config.name;
  const spec = engineSpec.actions[name];

  const specType = spec.output?.type || VOID_TYPE;
  let calculatedType = typeEquals(specType, [WellKnownType.OBJECT])
    ? [WellKnownType.STRING]
    : specType;
  const multi = spec.output?.multi || false;

  // Construct action content and add to store
  const actionContent: ActionContent = {
    differentiator: ContentType.ACTION,
    key,
    parentKey,
    name,
    type: calculatedType,
    multi,
    optional: false,
    childKeyMap: {},
    errors: [],
  };
  contentStore.indexedContent[actionContent.key] = actionContent;

  // Construct child args and link to parent
  Object.entries(config.arguments).forEach(([argName, expressionConfigs]) => {
    const inputSpec = spec.inputs[argName];
    const argContent = constructArgument(expressionConfigs, key, inputSpec, state);
    actionContent.childKeyMap[argName] = argContent.key;
  });

  // Construct child variable and link to parent
  const varContent = !typeEquals(calculatedType, VOID_TYPE)
    ? constructVariable(config.output, key, calculatedType, multi, false, state)
    : undefined;
  if (varContent !== undefined) {
    actionContent.variableContentKey = varContent.key;
  }

  return actionContent;
}

function constructFunction(config: FunctionConfig, parentKey: ContentKey, state: EditorState) {
  const { contentStore, engineSpec, typeSystem } = state;
  const indexedContent = contentStore.indexedContent;
  const key = nextKey(contentStore);
  const name = config.name;
  const spec = engineSpec.functions[name];

  let calculatedType = [...(spec.output?.type || VOID_TYPE)];
  const multi = spec.output?.multi || false;

  const argumentContent = resolveContent<ArgumentContent>(parentKey, indexedContent);
  const parentDeclaredType = argumentContent.declaredType;

  const returnTypeInBounds = doesTypeMatchRequirements(
    calculatedType,
    parentDeclaredType,
    typeSystem,
  );
  if (returnTypeInBounds) {
    calculatedType = [...parentDeclaredType];
  }
  // TODO: Error if function output has no overlap.

  // Construct function content and add to store
  const functionContent: FunctionContent = {
    differentiator: ContentType.FUNCTION,
    key,
    parentKey,
    name,
    type: calculatedType,
    multi,
    optional: false,
    childKeyMap: {},
    errors: [],
  };
  contentStore.indexedContent[functionContent.key] = functionContent;

  // Construct child arg content and link to parent
  Object.entries(config.arguments).forEach(([argName, expressionConfigs]) => {
    const inputSpec = spec.inputs[argName];
    const argContent = constructArgument(expressionConfigs, key, inputSpec, state);
    functionContent.childKeyMap[argName] = argContent.key;
  });

  return functionContent;
}

function constructReference(config: ReferenceConfig, parentKey: ContentKey, state: EditorState) {
  const { contentStore } = state;
  const referenceConfig = config as ReferenceConfig;
  const referencedContent = findExecutableContent(contentStore, referenceConfig.coordinates);
  let variableContent: VariableContent | undefined;
  let { path, coordinates } = referenceConfig;
  if (referencedContent.differentiator === ContentType.ACTION) {
    const actionContent = referencedContent as ActionContent;
    if (actionContent.variableContentKey === undefined) {
      throw new Error(
        `Illegal state: coordinates [${coordinates
          .map((value) => value.toString())
          .join(',')}] cannot be used as reference`,
      );
    }
    variableContent = resolveContent<VariableContent>(
      actionContent.variableContentKey,
      contentStore.indexedContent,
    );
  } else if (referencedContent.differentiator === ContentType.PROCESS) {
    const processContent = referencedContent as ProcessContent;
    if (referenceConfig.path.length === 0) {
      throw new Error(
        'Invalid Reference Config: initial variable references require at least one path segment',
      );
    }
    const [basePath, [...internalPath]] = path;
    const matchingVariableKey = processContent.inputVariableKeys.find((contentKey) => {
      const initialVariableContent = contentStore.indexedContent[contentKey] as VariableContent;
      return basePath === initialVariableContent.basePath;
    });
    if (matchingVariableKey === undefined) {
      throw new Error(`Illegal reference config: initial variable ${basePath} does not exist`);
    }
    variableContent = contentStore.indexedContent[matchingVariableKey] as VariableContent;
    path = internalPath;
  }
  if (variableContent === undefined) {
    throw new Error(`Unexpected content type resolved for coordinates [${coordinates.join(',')}]}`);
  }
  const { type, multi, optional } = resolveExpressionInfoForReference(
    variableContent.key,
    path,
    state,
  );
  const referenceKey = nextKey(contentStore);
  const referenceContent: ReferenceContent = {
    differentiator: ContentType.REFERENCE,
    key: referenceKey,
    parentKey,
    variableKey: variableContent.key,
    type,
    multi,
    optional,
    path,
    errors: [],
  };
  variableContent.referenceKeys.push(referenceContent.key);
  contentStore.indexedContent[referenceContent.key] = referenceContent;

  referenceContent.errors.push(...validateReference(referenceKey, contentStore.indexedContent));

  return referenceContent;
}

function constructVariable(
  config: VariableConfig | undefined,
  parentKey: ContentKey,
  type: TypeIntersection,
  multi: boolean,
  initial: boolean,
  state: EditorState,
) {
  const { contentStore } = state;

  const referenceKeys: ContentKey[] = [];
  const variableContent: VariableContent = {
    differentiator: ContentType.VARIABLE,
    key: nextKey(contentStore),
    parentKey,
    title: config?.title,
    description: config?.description,
    translationKey: config?.translationKey,
    optional: false,
    type,
    multi,
    initial,
    referenceKeys,
    errors: [],
  };
  contentStore.indexedContent[variableContent.key] = variableContent;
  return variableContent;
}

/**
 * This function removes all descendants of a deleted parent node from the store to avoid memory leaks. This function
 * does not remove this state as a child reference from any parent node -- this should be done by the caller. Also note
 * that this function only deletes the descendant states from the store, it does not remove their links to each other.
 * @param contentStore the store from which the state should be deleted
 * @param keyToDelete the key for the state to be recursively deleted from the store
 */
export function recursiveDelete(contentStore: ContentStore, keyToDelete: string) {
  recurseDown(
    contentStore.indexedContent,
    (content) => {
      if (contentStore.indexedContent.hasOwnProperty(content.key)) {
        delete contentStore.indexedContent[content.key];
      }
    },
    keyToDelete,
    true,
  );
}

export function addNewExecutable(
  parentKey: string,
  newConfig: ActionConfig | ControlConfig,
  state: EditorState,
) {
  let { contentStore } = state;
  const blockContent = resolveContent<BlockContent>(parentKey, contentStore.indexedContent);
  if (blockContent.differentiator !== ContentType.BLOCK) {
    throw new Error(
      `Attempted to add a new action on an illegal content type: ${blockContent.differentiator}`,
    );
  }
  const newChildState = constructExecutable(newConfig, parentKey, state);
  newChildState.parentKey = blockContent.key;
  blockContent.childKeys.push(newChildState.key);
  return newChildState.key;
}

export function deleteListItem(key: string, contentStore: ContentStore) {
  const content = resolveContent(key, contentStore.indexedContent);
  if (content !== undefined) {
    const parentKey = content.parentKey as ContentKey;
    const parentContent = resolveContent<BlockContent | ArgumentContent>(
      parentKey,
      contentStore.indexedContent,
    );
    const parentType = parentContent.differentiator;
    if (parentType !== ContentType.BLOCK && parentType !== ContentType.ARGUMENT) {
      throw new Error(
        `Attempted to delete a list item from an illegal parent content type: ${parentType}`,
      );
    }
    const currentIndex = parentContent.childKeys.indexOf(key);
    parentContent.childKeys.splice(currentIndex, 1);
    parentContent.childKeys = [...parentContent.childKeys];
    contentStore.indexedContent[parentKey] = { ...parentContent };
    recursiveDelete(contentStore, key);
  }
}

export function reorderList(
  indexedContent: IndexedContent,
  parentKey: string,
  oldIndex: number,
  newIndex: number,
) {
  const listContent = resolveContent<ListContent>(parentKey, indexedContent);
  if (
    listContent.differentiator !== ContentType.BLOCK &&
    listContent.differentiator !== ContentType.ARGUMENT &&
    listContent.differentiator !== ContentType.PROCESS
  ) {
    throw new Error(
      `Attempted to execute reorder operation on not-list state: ${listContent.differentiator}`,
    );
  }
  const afterRemove = [
    ...listContent.childKeys.slice(0, oldIndex),
    ...listContent.childKeys.slice(oldIndex + 1),
  ];
  listContent.childKeys = [
    ...afterRemove.slice(0, newIndex),
    listContent.childKeys[oldIndex],
    ...afterRemove.slice(newIndex),
  ];
}

export function getContentAndAncestors(contentStore: ContentStore, key: string) {
  const ancestorPath: Content[] = [];
  recurseUp(
    contentStore.indexedContent,
    (content: Content) => {
      ancestorPath.push(content);
    },
    key,
    true,
  );
  return ancestorPath;
}

function findExecutableContent(
  contentStore: ContentStore,
  coordinates: Coordinates,
): ProcessContent | ActionContent {
  const processKey = contentStore.rootConfigKey as string;
  const processContent = resolveContent<ProcessContent>(processKey, contentStore.indexedContent);
  if (coordinates.length === 0) {
    return processContent;
  }
  let pointer: ListContent | ActionContent = resolveContent<BlockContent>(
    processContent.rootBlockKey as string,
    contentStore.indexedContent,
  );
  for (let i = 0; i < coordinates.length; i++) {
    if (pointer.differentiator === ContentType.ACTION) {
      // coordinates are invalid
      throw new Error(`Invalid coordinates: [${coordinates.join(',')}]}`);
    }
    const coordinate = coordinates[i];
    const childKey: ContentKey = (pointer as ListContent).childKeys[coordinate];
    pointer = resolveContent<ListContent | ActionContent>(childKey, contentStore.indexedContent);
  }
  return pointer as ActionContent;
}

function findCoordinates(indexedContent: IndexedContent, contentKey: ContentKey): Coordinates {
  const executableParents: Array<ActionContent | BlockContent | ControlContent> = [];
  recurseUp(
    indexedContent,
    (content) => {
      const contentType = content.differentiator;
      if (
        contentType === ContentType.ACTION ||
        contentType === ContentType.BLOCK ||
        contentType === ContentType.CONTROL
      ) {
        executableParents.push(content as ActionContent | BlockContent | ControlContent);
      }
    },
    contentKey,
  );

  const coordinates: number[] = [];
  for (let i = 0; i < executableParents.length - 1; i++) {
    const child = executableParents[i];
    const parent = executableParents[i + 1] as BlockContent | ControlContent; // actions can only be leaf nodes
    const childKey = child.key;
    const childCoordinate = parent.childKeys.indexOf(childKey);
    coordinates.push(childCoordinate);
  }

  return coordinates;
}

export function resolveParameterSpecForKey(key: string, state: EditorState) {
  let { contentStore } = state;
  return resolveParameterSpec(
    resolveContent<ArgumentContent | FunctionContent | ValueContent>(
      key,
      contentStore.indexedContent,
    ),
    state,
  );
}

export function resolveParameterSpec(
  expressionContent: ArgumentContent | FunctionContent | ValueContent | ReferenceContent,
  state: EditorState,
) {
  const { contentStore, engineSpec } = state;
  let pointer: Content = expressionContent;
  while (pointer.parentKey !== undefined && pointer.differentiator !== ContentType.ARGUMENT) {
    pointer = resolveContent(pointer.parentKey as string, contentStore.indexedContent);
  }
  if (pointer.differentiator !== ContentType.ARGUMENT) {
    throw new Error('Unexpected state structure encountered');
  }
  const argContent = pointer as ArgumentContent;
  const argParent = resolveContent<
    FunctionContent | ActionContent | ControlContent | ProcessContent
  >(argContent.parentKey as string, contentStore.indexedContent);

  const argName = Object.entries(argParent.childKeyMap).find(
    ([, key]) => key === argContent.key,
  )?.[0];
  if (argName === undefined) {
    throw new Error(`Failed to find arg name for key ${argContent.key}`);
  }

  if (argParent.differentiator === ContentType.FUNCTION) {
    const functionContent = argParent as FunctionContent;
    return engineSpec.functions[functionContent.name].inputs[argName];
  } else if (argParent.differentiator === ContentType.ACTION) {
    const actionContent = argParent as ActionContent;
    return engineSpec.actions[actionContent.name].inputs[argName];
  } else if (
    argParent.differentiator === ContentType.CONTROL &&
    argName === CONDITIONAL_CONDITION_PROP
  ) {
    return CONDITIONAL_CONTROL_SPEC.inputs[CONDITIONAL_CONDITION_PROP];
  } else if (argParent.differentiator === ContentType.PROCESS && argName === PROCESS_RETURN_PROP) {
    const processContent = argParent as ProcessContent;
    return engineSpec.processes[processContent.name].output as ExpressionSpec;
  }
  throw new Error('Unexpected error: unable to resolve parameter spec');
}

enum ReferenceType {
  /** Represents a reference that is unconditionally valid */
  VALID,
  /** Represents a valid reference that is valid but optionally-set */
  OPTIONAL,
  /** Represents a reference relationship that is invalid (variable set after use, variable
   * mutually-exclusive to referencing action) */
  UNREACHABLE,
}

function resolveReferenceType(
  variableKey: ContentKey,
  referenceLocationKey: ContentKey,
  indexedContent: IndexedContent,
): ReferenceType {
  const variableCoordinates = findCoordinates(indexedContent, variableKey);
  const referenceCoordinates = findCoordinates(indexedContent, referenceLocationKey);

  const variableIsPredecessor = areCoordinatesPredecessor(
    variableCoordinates,
    referenceCoordinates,
  );
  const sharedAncestor = getCoordinatesSharedAncestor(variableCoordinates, referenceCoordinates);
  const sharedAncestorIsBlock = sharedAncestor.length % 2 === 0;

  // A variable is unreachable if its coordinates are not a predecessor
  if (!variableIsPredecessor || !sharedAncestorIsBlock) {
    return ReferenceType.UNREACHABLE;
  }

  if (sharedAncestor.length === variableCoordinates.length - 1) {
    // the variable is not nested in a control, relative to the reference
    return ReferenceType.VALID;
  } else {
    return ReferenceType.OPTIONAL;
  }
}

function resolveExpressionInfoForReference(
  variableKey: ContentKey,
  path: string[],
  state: EditorState,
): ExpressionInfo {
  const {
    contentStore: { indexedContent },
    engineSpec: { types },
  } = state;

  const variableContent = resolveContent<VariableContent>(variableKey, indexedContent);
  let type = variableContent.type;
  let multi = variableContent.multi;
  let optional = variableContent.optional;
  for (let i = 0; i < path.length; i++) {
    if (type.length > 1) {
      throw new Error('Intersection types cannot declare a path');
    }
    const typeId: TypeId = type[0];
    const pathSegment = path[i];
    const property = types[typeId]?.properties[pathSegment];
    if (property === undefined) {
      throw new Error(`Failed to resolve path ${path.join('/')} for root type ${type}`);
    }
    type = property.type;
    multi = multi || property.multi;
    optional = optional || property.optional;
  }
  return { type, multi, optional };
}

export function validateReference(referenceKey: ContentKey, indexedContent: IndexedContent) {
  const referenceContent = indexedContent[referenceKey] as ReferenceContent;
  const variableKey = referenceContent.variableKey;

  const referenceType = resolveReferenceType(
    variableKey,
    referenceContent.parentKey as string,
    indexedContent,
  );

  const errors: ValidationError[] = [];
  if (referenceType === ReferenceType.UNREACHABLE) {
    errors.push(invalidReference(variableKey, referenceKey));
  } else if (referenceType === ReferenceType.OPTIONAL) {
    recurseUp(indexedContent, (content) => {}, referenceKey);
    // TODO iterate up tree to see if check is made
  }
  return errors;
}

function resolveCurrentSlice(storeStructure: StoreStructure) {
  if (!storeStructure.LOGICFORGE_FRAME_EDITOR) {
    throw new Error(`Unexpected state: slice is not defined`);
  }
  return storeStructure.LOGICFORGE_FRAME_EDITOR;
}

export const {
  initEditor,
  setSelection,
  convertValueToFunction,
  convertValueToReference,
  addInputValue,
  addExecutable,
  reorderInput,
  deleteItem,
  updateValue,
  updateValueType,
  updateReferencePath,
  moveExecutable,
  updateVariable,
} = frameEditorSlice.actions;

export default frameEditorSlice.reducer;
