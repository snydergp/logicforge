import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreStructure } from '../types';
import {
  ActionConfig,
  ActionContent,
  ActionSpec,
  ArgumentContent,
  BlockConfig,
  BlockContent,
  CONDITIONAL_CONDITION_PROP,
  CONDITIONAL_CONTROL_SPEC,
  ConditionalConfig,
  ConditionalContent,
  ConditionalReferenceConfig,
  ConditionalReferenceContent,
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
  ExpressionSpec,
  FunctionConfig,
  FunctionContent,
  FunctionSpec,
  IndexedContent,
  ListContent,
  LogicForgeConfig,
  PROCESS_RETURN_PROP,
  ProcessConfig,
  ProcessContent,
  ReferenceConfig,
  ReferenceContent,
  unsatisfiedInputTypeMismatch,
  validateValue,
  ValidationError,
  ValueConfig,
  ValueContent,
  VariableConfig,
  VariableContent,
} from '../../types';
import {
  areCoordinatesPredecessor,
  Coordinates,
  generateTypeSystem,
  getCoordinatesSharedAncestor,
  nextKey,
  recurseDown,
  recurseUp,
  resolveContent,
  TypeSystem,
} from '../../util';
import { WellKnownType } from '../../constant/well-known-type';
import { MetadataProperties } from '../../constant/metadata-properties';

export type EditorState = {
  selection: string;
  engineSpec: EngineSpec;
  contentStore: ContentStore;
  typeSystem: TypeSystem;
};

const editorsSlice = createSlice({
  name: 'LOGICFORGE',
  initialState: {} as EditorState,
  reducers: {
    initEditor: {
      reducer(state, action: PayloadAction<LogicForgeConfig, string, { engineSpec: EngineSpec }>) {
        const config = action.payload;
        const { engineSpec } = action.meta;
        state.engineSpec = engineSpec;
        const contentStore: ContentStore = {
          count: 0,
          indexedContent: {},
          rootConfigKey: '',
        };
        state.contentStore = contentStore;
        state.typeSystem = generateTypeSystem(engineSpec.types);
        loadRootContent(config, state);
        state.selection = contentStore.rootConfigKey;
        return state;
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
        replaceValueWithFunction(key, functionName, state);
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
        replaceValueWithReference(key, variableKey, path, state);
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
            type: ContentType.CONTROL | ContentType.ACTION;
          }
        >,
      ) {
        const name = action.meta.name;
        const type = action.meta.type;
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
      prepare(payload: string, name: string, type: ContentType.CONTROL | ContentType.ACTION) {
        return { payload, meta: { name, type } };
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

export const selectEditorSelection = (state: StoreStructure) => {
  return state['LOGICFORGE']?.selection;
};

/**
 * Internal-only selector used for creating memoizable composite selectors
 */
const selectContentStore = (state: StoreStructure) => {
  return state['LOGICFORGE']?.contentStore;
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
  const contentStore = state['LOGICFORGE']?.contentStore;
  if (contentStore === undefined) {
    throw new Error('Illegal state: content store is not defined');
  }
  return contentStore.indexedContent[key];
};

export const selectIsInSelectedPath = (key: ContentKey) => (state: StoreStructure) => {
  const contentStore = state['LOGICFORGE']?.contentStore;
  const selection = state['LOGICFORGE']?.selection;
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
  const contentStore = state['LOGICFORGE']?.contentStore;
  if (contentStore === undefined) {
    throw new Error('Illegal state: content store is not defined');
  }
  return contentStore.indexedContent;
};

export const selectTypeSystem = (state: StoreStructure) => {
  const typeSystem = state['LOGICFORGE']?.typeSystem;
  if (typeSystem === undefined) {
    throw new Error('Illegal state: type system is not defined');
  }
  return typeSystem;
};

export const selectEngineSpec = (state: StoreStructure) => {
  const engineSpec = state['LOGICFORGE']?.engineSpec;
  if (engineSpec === undefined) {
    throw new Error('Illegal state: engine spec is not defined');
  }
  return engineSpec;
};

export const selectTypeSpec = (typeId: string) => (state: StoreStructure) => {
  const engineSpec = state['LOGICFORGE']?.engineSpec;
  if (engineSpec === undefined) {
    throw new Error('Illegal state: engine spec is not defined');
  }
  return engineSpec.types[typeId];
};

export const selectActionSpec = (actionName: string) => (state: StoreStructure) => {
  const engineSpec = state['LOGICFORGE']?.engineSpec;
  if (engineSpec === undefined) {
    throw new Error('Illegal state: engine spec is not defined');
  }
  return engineSpec.actions[actionName];
};

export const selectFunctionSpec = (functionName: string) => (state: StoreStructure) => {
  const engineSpec = state['LOGICFORGE']?.engineSpec;
  if (engineSpec === undefined) {
    throw new Error('Illegal state: engine spec is not defined');
  }
  return engineSpec.functions[functionName];
};

export const selectFunctionInputSpec =
  (functionName: string, inputName: string) => (state: StoreStructure) => {
    const engineSpec = state['LOGICFORGE']?.engineSpec;
    if (engineSpec === undefined) {
      throw new Error('Illegal state: engine spec is not defined');
    }
    return engineSpec.functions[functionName].inputs[inputName];
  };

export const selectAvailableVariables = (key: string) => (state: StoreStructure) => {
  return findAvailableVariables(key, state.LOGICFORGE as EditorState);
};

export const selectParameterSpecificationForKey = (key?: string) => (state: StoreStructure) => {
  if (key !== undefined) {
    const editorState = state['LOGICFORGE'];
    if (editorState !== undefined) {
      return resolveParameterSpecForKey(key, editorState);
    }
  }
};

export const selectSubTreeErrors = (key: string) => (state: StoreStructure) => {
  const { contentStore } = state['LOGICFORGE'] as EditorState;
  const indexedContent = contentStore.indexedContent;
  const errors: { [key: ContentKey]: ValidationError[] } = {};
  recurseDown(
    indexedContent,
    (content) => {
      if (content.errors.length > 1) {
        errors[content.key] = content.errors;
      }
    },
    key,
  );
  return errors;
};

function removeChildKey(content: ListContent, key: string) {
  content.childKeys.splice(content.childKeys.indexOf(key), 1);
}

function addChildKey(content: ListContent, key: string, index: number) {
  const oldChildren = content.childKeys;
  content.childKeys = [...oldChildren.slice(0, index), ...[key], ...oldChildren.slice(index)];
}

function newActionConfigForSpec(actionName: string, spec: ActionSpec): ActionConfig {
  const inputArgumentConfigs: { [key: string]: ExpressionConfig[] } = {};
  Object.entries(spec.inputs).forEach(([key]) => {
    inputArgumentConfigs[key] = [{ type: ConfigType.VALUE, value: '' }];
  });

  return {
    type: ConfigType.ACTION,
    name: actionName,
    arguments: inputArgumentConfigs,
  };
}

function newConditionalConfig(): ConditionalConfig {
  return {
    type: ConfigType.CONTROL_STATEMENT,
    controlType: ControlType.CONDITIONAL,
    conditionalExpression: {
      type: ConfigType.VALUE,
      value: '',
    },
    blocks: [
      {
        type: ConfigType.BLOCK,
        executables: [],
      },
      {
        type: ConfigType.BLOCK,
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
    contentToDelete.type !== ContentType.ACTION &&
    contentToDelete.type !== ContentType.CONTROL &&
    typeof contentToDelete.parentKey === 'string'
  ) {
    const parentArgContent = resolveContent<ArgumentContent>(
      contentToDelete.parentKey,
      contentStore.indexedContent,
    );
    const expressionSpec = resolveParameterSpec(parentArgContent, state);
    if (!expressionSpec.multi) {
      // when deleting a single argument expression, replace it with a new empty value
      const replacementValue = constructValue(
        {
          type: ConfigType.VALUE,
          value: '',
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
  const { allowMulti, declaredTypeId } = argumentContent;
  let typeId = declaredTypeId;
  if (typeId === WellKnownType.OBJECT) {
    // default new values of unspecified type to string input mode
    typeId = WellKnownType.STRING;
  }
  const availableFunctionIds = Object.keys(
    findFunctionsMatchingTypeConstraints(typeId, allowMulti, state),
  );
  const availableVariables = findAvailableVariables(parentKey, state).map((variable) => {
    return { key: variable.key, conditional: variable.conditional };
  });

  const valueContent = {
    type: ContentType.VALUE,
    key: nextKey(contentStore),
    parentKey,
    multi: false,
    value,
    typeId,
    availableFunctionIds,
    availableVariables,
    errors: validateValue(value, typeId, engineSpec),
  } as ValueContent;
  indexedContent[valueContent.key] = valueContent;

  const parentContent = resolveContent<ArgumentContent>(parentKey, indexedContent);
  parentContent.childKeys = [...parentContent.childKeys, valueContent.key];

  return valueContent;
}

function replaceValueWithReference(
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
  const { typeId, multi } = resolveTypeForReference(variableKey, referencePath, state);
  parentArgContent.calculatedTypeId = typeId;
  const errors: ValidationError[] = [];
  if (
    typeId !== parentArgContent.declaredTypeId &&
    (typeSystem.descendants[parentArgContent.declaredTypeId] === undefined ||
      typeSystem.descendants[parentArgContent.declaredTypeId].indexOf(typeId) < 0)
  ) {
    errors.push(unsatisfiedInputTypeMismatch(parentArgContent.declaredTypeId, typeId));
  }
  indexedContent[referenceKey] = {
    key: referenceKey,
    type: ContentType.REFERENCE,
    parentKey: existingValueContent.parentKey,
    variableKey,
    path: referencePath,
    errors, // TODO validate initial state
    typeId,
    multi,
  } as ReferenceContent;
  const oldIndex = parentArgContent.childKeys.indexOf(valueKey);
  parentArgContent.childKeys[oldIndex] = referenceKey;
  recursiveDelete(contentStore, valueKey);
  variableContent.referenceKeys.push(referenceKey);
  if (selection === valueKey) {
    state.selection = referenceKey;
  }
  propagateTypeUpdate(referenceKey, state);
}

function replaceValueWithFunction(valueKey: ContentKey, functionName: string, state: EditorState) {
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
    type: ContentType.FUNCTION,
    parentKey: existingArgContent.key,
    name: functionName,
    spec: functionSpec,
    typeId: functionSpec.output.typeId,
    multi: functionSpec.output.multi,
    errors: [],
    childKeyMap: {},
  };
  contentStore.indexedContent[functionKey] = functionContent;

  existingArgContent.childKeys[existingIndex] = functionKey;

  const dynamicReturnProperty = functionSpec.metadata[MetadataProperties.DYNAMIC_RETURN_TYPE];

  Object.entries(functionSpec.inputs).forEach(([inputName, inputSpec]) => {
    const argKey = nextKey(contentStore);
    const typeId = inputSpec.typeId;
    contentStore.indexedContent[argKey] = {
      key: argKey,
      type: ContentType.ARGUMENT,
      parentKey: functionKey,
      errors: [],
      allowMulti: inputSpec.multi,
      declaredTypeId: typeId,
      calculatedTypeId: typeId,
      propagateTypeChanges: inputName === dynamicReturnProperty,
      allowedTypeIds: [...(typeSystem.descendants[typeId] || []), typeId],
      childKeys: [],
    } as ArgumentContent;
    functionContent.childKeyMap[inputName] = argKey;

    doAddInputValue(argKey, '', state);
  });
  if (selection === valueKey) {
    state.selection = functionKey;
  }
}

function propagateTypeUpdate(expressionKey: string, state: EditorState) {
  const { contentStore } = state;
  let indexedContent = contentStore.indexedContent;
  const updatedExpression = resolveContent<ExpressionContent>(expressionKey, indexedContent);
  const typeId = updatedExpression.typeId as string;
  const multi = updatedExpression.multi;
  const parentArgument = resolveContent<ArgumentContent>(
    updatedExpression.parentKey as string,
    indexedContent,
  );
  parentArgument.calculatedTypeId = typeId;
  const parent = resolveContent<FunctionContent | ActionContent>(
    parentArgument.parentKey as string,
    indexedContent,
  );
  if (parentArgument.allowedTypeIds.indexOf(typeId) < 0 || (multi && !parentArgument.allowMulti)) {
    ensureErrorByCode(parent.errors, {
      code: ErrorCode.UNSATISFIED_INPUT_TYPE_MISMATCH,
      level: ErrorLevel.ERROR,
      data: {},
    });
  } else {
    removeErrorsByCode(parent.errors, ErrorCode.UNSATISFIED_INPUT_TYPE_MISMATCH);
    // continue propagation upward only if there are no errors
    if (parentArgument.propagateTypeChanges) {
      parent.typeId = typeId;
      parent.multi = multi;
      if (parent.type === ContentType.FUNCTION) {
        propagateTypeUpdate(parent.key, state);
      } else {
        const actionParent = parent as ActionContent;
        if (actionParent.variableContentKey !== undefined) {
          const variableContent = resolveContent<VariableContent>(
            actionParent.variableContentKey as string,
            indexedContent,
          );
          variableContent.typeId = typeId;
          variableContent.multi = multi;
          variableContent.referenceKeys.forEach((referenceKey: ContentKey) => {
            const referenceContent = resolveContent<ReferenceContent>(referenceKey, indexedContent);
            referenceContent.typeId = typeId;
            referenceContent.multi = multi;
            propagateTypeUpdate(referenceKey, state);
          });
        }
      }
    }
  }
}

function doUpdateValue(value: string, key: string, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const valueContent = resolveContent<ValueContent>(key, contentStore.indexedContent);
  const { typeId, errors } = valueContent;
  valueContent.value = value;
  const newErrors = validateValue(value, typeId as string, engineSpec);
  // Replace any existing INVALID_VALUE errors with any new errors found
  removeErrorsByCode(errors, ErrorCode.INVALID_VALUE);
  errors.push(...newErrors);
}

function doUpdateValueType(newTypeId: string, key: string, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const indexedContent = contentStore.indexedContent;
  const valueContent = resolveContent<ValueContent>(key, indexedContent);
  const argumentContent = resolveContent<ArgumentContent>(
    valueContent.parentKey as string,
    indexedContent,
  );
  const { value, errors } = valueContent;
  valueContent.typeId = newTypeId;
  const newErrors = validateValue(value, newTypeId, engineSpec);
  // Replace any existing INVALID_VALUE errors with any new errors found
  removeErrorsByCode(errors, ErrorCode.INVALID_VALUE);
  errors.push(...newErrors);
  // QUESTION: should functions ignore the selected type restriction?
  valueContent.availableFunctionIds = Object.keys(
    findFunctionsMatchingTypeConstraints(newTypeId, argumentContent.allowMulti, state),
  );
  propagateTypeUpdate(key, state);
}

function doMoveExecutable(key: string, newParentKey: string, newIndex: number, state: EditorState) {
  const { contentStore } = state;
  const indexedContent = contentStore.indexedContent;
  const executableContent = resolveContent<ExecutableContent>(key, indexedContent);
  const oldParentKey = executableContent.parentKey as string;
  const oldParentBlock = resolveContent<BlockContent>(oldParentKey, indexedContent);
  removeChildKey(oldParentBlock, key);
  const newParentBlock =
    oldParentKey === newParentKey
      ? oldParentBlock
      : resolveContent<BlockContent>(newParentKey, indexedContent);
  addChildKey(newParentBlock, key, newIndex);
  executableContent.parentKey = newParentKey;
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
  const foundError = errors.find((err) => err.code === err.code);
  if (foundError === undefined) {
    errors.push(error);
  }
}

function findFunctionsMatchingTypeConstraints(typeId: string, multi: boolean, state: EditorState) {
  const { engineSpec, typeSystem } = state;
  const matchingFunctions: { [key: string]: FunctionSpec } = {};
  if (typeSystem !== undefined && engineSpec !== undefined) {
    const subtypes = typeSystem.descendants[typeId];
    Object.entries(engineSpec.functions).forEach(([key, functionSpec]) => {
      const functionOutput = functionSpec.output;
      const functionOutputTypeId = functionOutput.typeId;
      // function output must be of the same type or able to be converted/coerced into the type
      if (
        typeId === functionOutputTypeId ||
        (subtypes !== undefined && subtypes.indexOf(functionOutputTypeId) >= 0)
      ) {
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
        (content.type === ContentType.ACTION || content.type === ContentType.CONTROL) &&
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
        if (executableContent.type === ContentType.ACTION) {
          const actionContent = executableContent as ActionContent;
          return getActionVariable(actionContent, contentStore, true);
        } else if (executableContent.type === ContentType.CONTROL) {
          const controlContent = executableContent as ControlContent;
          if (controlContent.controlType === ControlType.CONDITIONAL) {
            return collectControlVariables(controlContent as ConditionalContent, contentStore);
          }
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
      if (siblingContent.type === ContentType.ACTION) {
        const variableModel = getActionVariable(
          siblingContent as ActionContent,
          contentStore,
          false,
        );
        if (variableModel !== undefined) {
          variables.push(variableModel);
        }
      } else if (siblingContent.type === ContentType.CONTROL) {
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
    if (grandparentContent.type === ContentType.CONTROL) {
      childContent = grandparentContent as ControlContent;
      parentBlock = resolveContent<BlockContent>(childContent.key, indexedContent);
      childIndex = parentBlock.childKeys.indexOf(childContent.key);
    } else {
      break;
    }
  }

  return variables;
}

enum VariableRelationship {
  UNREACHABLE,
  REACHABLE,
  CONDITIONAL,
}

function findVariableRelationship(source: Coordinates, target: Coordinates) {
  const ancestor = getCoordinatesSharedAncestor(source, target);
  const ancestorLength = ancestor.length;
  if (ancestorLength !== 0 && ancestorLength % 2 === 0) {
    // coordinate share a conditional but in different blocks
    return VariableRelationship.UNREACHABLE;
  } else if (areCoordinatesPredecessor(source, target)) {
    if (target.length > source.length) {
      return VariableRelationship.CONDITIONAL;
    } else {
      return VariableRelationship.REACHABLE;
    }
  } else {
    return VariableRelationship.UNREACHABLE;
  }
}

function getCoordinatesForContent(contentKey: string, indexedContent: IndexedContent) {
  let rootActionContent: ActionContent | undefined;
  recurseUp(
    indexedContent,
    (content) => {
      if (content.type === ContentType.ACTION && rootActionContent === undefined) {
        rootActionContent = content as ActionContent;
      }
    },
    contentKey,
  );

  if (rootActionContent === undefined) {
    throw new Error('Attempted to find coordinates outside of executable context');
  }

  const coordinates: number[] = [];
  let key = rootActionContent.key;
  const visitContent = (content: Content) => {
    let coordinate = (content as ListContent).childKeys.indexOf(key);
    key = content.key;
    coordinates.push(coordinate);
  };
  recurseUp(indexedContent, visitContent, contentKey);
  return coordinates.reverse();
}

export function loadRootContent(config: LogicForgeConfig, state: EditorState) {
  const { contentStore } = state;
  if (config.type !== ConfigType.PROCESS) {
    throw new Error(`Illegal content root type: ${config.type}`);
  }
  const rootState = constructProcess(config, state);
  contentStore.rootConfigKey = rootState.key;
}

function constructProcess(config: ProcessConfig, state: EditorState) {
  const { engineSpec, contentStore } = state;
  const processKey = nextKey(contentStore);
  const processName = config.name;
  const processSpec = engineSpec.processes[processName];
  const output = processSpec.output;
  const outputTypeId = output?.typeId;
  const outputMulti = output?.multi || false;

  // construct process
  const processContent: ProcessContent = {
    key: processKey,
    parentKey: null,
    type: ContentType.PROCESS,
    name: processName,
    spec: processSpec,
    typeId: outputTypeId !== undefined ? outputTypeId : null,
    multi: outputMulti !== undefined ? outputMulti : false,
    inputVariableKeys: [],
    childKeyMap: {},
    errors: [],
  };
  contentStore.indexedContent[processContent.key] = processContent;

  // set process as root content
  contentStore.rootConfigKey = processKey;

  // construct root block and link to process
  const rootBlockContent = constructBlock(config.rootBlock, processKey, state);
  rootBlockContent.parentKey = processKey;
  processContent.rootBlockKey = rootBlockContent.key;

  // if process has return, define the return arg content and link to process
  if (outputTypeId !== undefined) {
    const returnExpressionConfig = config.returnExpression || [
      {
        type: ConfigType.VALUE,
        value: '',
      } as ValueConfig,
    ];
    const returnArgContent = constructArgument(
      returnExpressionConfig,
      processKey,
      outputTypeId,
      outputMulti,
      state,
    );
    returnArgContent.parentKey = processKey;
    processContent.childKeyMap[PROCESS_RETURN_PROP] = returnArgContent.key;
  }

  // construct input var content and link to process
  processContent.inputVariableKeys.push(
    ...Object.entries(processSpec.inputs).map(([name, variableSpec]) => {
      const variableConfig = {
        type: ConfigType.VARIABLE,
        title: variableSpec.title,
        description: variableSpec.description,
      } as VariableConfig;
      const typeId = variableSpec.typeId;
      const multi = variableSpec.multi;
      const variableContent = constructVariable(
        variableConfig,
        processKey,
        typeId,
        multi,
        true,
        state,
      );
      variableContent.parentKey = processKey;
      variableContent.basePath = name;
      variableContent.optional = variableSpec.optional;
      return variableContent.key;
    }),
  );

  return processContent;
}

function constructArgument(
  configs: ExpressionConfig[],
  parentKey: string,
  typeId: string,
  multi: boolean,
  state: EditorState,
) {
  const { contentStore, typeSystem } = state;
  const declaredTypeId = typeId;
  const allowedTypeIds = [typeId, ...(typeSystem.descendants[declaredTypeId] || [])];
  const key = nextKey(contentStore);

  const calculatedTypeId = typeId === WellKnownType.OBJECT ? WellKnownType.STRING : typeId;

  // Construct arg content and add to store
  const argContent: ArgumentContent = {
    type: ContentType.ARGUMENT,
    key,
    parentKey,
    allowMulti: multi,
    declaredTypeId,
    allowedTypeIds,
    propagateTypeChanges: false, // overridden by parent as needed
    calculatedTypeId, // overridden once children are constructed
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
  switch (config.type) {
    case ConfigType.VALUE:
      return constructValue(config as ValueConfig, parentKey, state);
    case ConfigType.FUNCTION:
      return constructFunction(config as FunctionConfig, parentKey, state);
    case ConfigType.REFERENCE:
      return constructReference(config as ReferenceConfig, parentKey, state);
    case ConfigType.CONDITIONAL_REFERENCE:
      return constructConditionalReference(config as ConditionalReferenceConfig, parentKey, state);
  }
}

function constructBlock(config: BlockConfig, parentKey: string, state: EditorState) {
  const { contentStore } = state;
  const blockKey = nextKey(contentStore);

  // Construct content and add to store
  const blockContent: BlockContent = {
    type: ContentType.BLOCK,
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
  switch (config.type) {
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
    type: ContentType.CONTROL,
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
    conditionSpec.typeId,
    conditionSpec.multi,
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
  let typeId = argContent.declaredTypeId;
  if (typeId === WellKnownType.OBJECT) {
    // default new values of unspecified type to string input mode
    typeId = WellKnownType.STRING;
  }

  const errors: ValidationError[] = [];

  // Construct value content and add to store
  const valueContent = {
    type: ContentType.VALUE,
    key: nextKey(contentStore),
    parentKey,
    typeId,
    multi: false,
    value,
    availableFunctionIds: [],
    availableVariables: [],
    errors,
  } as ValueContent;
  contentStore.indexedContent[valueContent.key] = valueContent;

  // Find available functions and update content
  const availableFunctions = findFunctionsMatchingTypeConstraints(
    typeId,
    argContent.allowMulti,
    state,
  );
  valueContent.availableFunctionIds.push(...Object.keys(availableFunctions));

  // Find available variables and update content
  const availableVariables = findAvailableVariables(parentKey, state);
  valueContent.availableVariables.push(...availableVariables);

  // Validate value and update content
  valueContent.errors.push(...validateValue(value, typeId, engineSpec));

  return valueContent;
}

function constructAction(config: ActionConfig, parentKey: ContentKey, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const key = nextKey(contentStore);
  const name = config.name;
  const spec = engineSpec.actions[name];

  // for actions with dynamic return types, override the output type with the output type of the
  //  input defined in the metadata
  const outputTypeInputName = spec.metadata[MetadataProperties.DYNAMIC_RETURN_TYPE];
  let calculatedTypeId = spec.output?.typeId || null;
  if (calculatedTypeId === WellKnownType.OBJECT) {
    calculatedTypeId = WellKnownType.STRING;
  }
  const multi = spec.output?.multi || false;

  // Construct action content and add to store
  const actionContent: ActionContent = {
    type: ContentType.ACTION,
    key,
    parentKey,
    name,
    spec,
    typeId: calculatedTypeId,
    multi,
    childKeyMap: {},
    errors: [],
  };
  contentStore.indexedContent[actionContent.key] = actionContent;

  // Construct child args and link to parent
  Object.entries(config.arguments).forEach(([argName, expressionConfigs]) => {
    const { typeId, multi } = spec.inputs[argName];
    const argContent = constructArgument(expressionConfigs, key, typeId, multi, state);
    if (argName === outputTypeInputName) {
      calculatedTypeId = argContent.calculatedTypeId;
      argContent.propagateTypeChanges = true;
    }
    actionContent.childKeyMap[argName] = argContent.key;
  });

  // Construct child variable and link to parent
  const varContent =
    calculatedTypeId !== null
      ? constructVariable(config.output, key, calculatedTypeId, multi, false, state)
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

  const outputTypeInputName = spec.metadata[MetadataProperties.DYNAMIC_RETURN_TYPE];
  let calculatedTypeId = spec.output?.typeId || null;
  const multi = spec.output?.multi || false;

  const argumentContent = resolveContent<ArgumentContent>(parentKey, indexedContent);
  const parentDeclaredTypeId = argumentContent.declaredTypeId;

  const returnTypeInBounds =
    calculatedTypeId === parentDeclaredTypeId ||
    typeSystem.descendants[parentDeclaredTypeId].indexOf(calculatedTypeId as string) > 0;
  if (returnTypeInBounds) {
    calculatedTypeId = parentDeclaredTypeId;
  }
  // TODO: Error if function output has no overlap.

  // Construct function content and add to store
  const functionContent: FunctionContent = {
    type: ContentType.FUNCTION,
    key,
    parentKey,
    name,
    spec,
    typeId: calculatedTypeId,
    multi,
    childKeyMap: {},
    errors: [],
  };
  contentStore.indexedContent[functionContent.key] = functionContent;

  // Construct child arg content and link to parent
  Object.entries(config.arguments).forEach(([argName, expressionConfigs]) => {
    const { typeId, multi } = spec.inputs[argName];
    const argContent = constructArgument(expressionConfigs, key, typeId, multi, state);
    if (name === outputTypeInputName) {
      calculatedTypeId = argContent.calculatedTypeId;
    }
    functionContent.childKeyMap[argName] = argContent.key;
  });

  return functionContent;
}

function constructConditionalReference(
  config: ConditionalReferenceConfig,
  parentKey: string,
  state: EditorState,
) {
  const { contentStore } = state;
  const indexedContent = contentStore.indexedContent;
  const parentArg = resolveContent<ArgumentContent>(parentKey, indexedContent);
  const { declaredTypeId } = parentArg;
  const referenceKey = nextKey(contentStore);

  // Construct conditional reference content and add to store
  const referenceContent: ConditionalReferenceContent = {
    type: ContentType.CONDITIONAL_REFERENCE,
    key: referenceKey,
    parentKey,
    childKeys: [],
    typeId: declaredTypeId,
    multi: false,
    errors: [],
  };
  contentStore.indexedContent[referenceKey] = referenceContent;

  // Resolve all references and link to content
  config.references.forEach((coordinates) => {
    const referencedActionContent = findExecutableContent<ActionContent>(contentStore, coordinates);
    if (
      referencedActionContent === undefined ||
      referencedActionContent.variableContentKey === undefined
    ) {
      throw new Error(
        `Illegal state: coordinates [${coordinates
          .map((value) => value.toString())
          .join(',')}] cannot be used as reference`,
      );
    }

    const referencedVarContent = resolveContent<VariableContent>(
      referencedActionContent.variableContentKey as string,
      indexedContent,
    );
    referencedVarContent.referenceKeys.push(referenceKey);
    referenceContent.childKeys.push(referencedVarContent.key);
  });

  // Construct expression arg child and link to parent
  const expressionArgContent = constructArgument(
    [config.expression],
    referenceKey,
    declaredTypeId,
    false,
    state,
  );
  expressionArgContent.parentKey = referenceKey;
  referenceContent.expressionKey = expressionArgContent.key;

  // Construct fallback expression arg child and link to parent
  const fallbackArgContent = constructArgument(
    [config.fallback],
    referenceKey,
    declaredTypeId,
    false,
    state,
  );
  fallbackArgContent.parentKey = referenceKey;
  referenceContent.fallbackKey = fallbackArgContent.key;

  return referenceContent;
}

function constructReference(config: ReferenceConfig, parentKey: ContentKey, state: EditorState) {
  const { contentStore } = state;
  const ref = config as ReferenceConfig;
  const referencedContent = findExecutableContent(contentStore, ref.coordinates);
  if (
    referencedContent.type !== ContentType.ACTION ||
    (referencedContent as ActionContent).variableContentKey === undefined
  ) {
    throw new Error(
      `Illegal state: coordinates [${ref.coordinates
        .map((value) => value.toString())
        .join(',')}] cannot be used as reference`,
    );
  }
  const actionContent = referencedContent as ActionContent;
  const variableContent = resolveContent<VariableContent>(
    actionContent.variableContentKey as string,
    contentStore.indexedContent,
  );
  const referenceContent: ReferenceContent = {
    type: ContentType.REFERENCE,
    key: nextKey(contentStore),
    parentKey,
    variableKey: referencedContent.variableContentKey as string,
    typeId: referencedContent.typeId,
    multi: referencedContent.multi,
    path: ref.path,
    errors: [],
  };
  variableContent.referenceKeys.push(referenceContent.key);
  contentStore.indexedContent[referenceContent.key] = referenceContent;
  return referenceContent;
}

function constructVariable(
  config: VariableConfig | undefined,
  parentKey: ContentKey,
  typeId: string,
  multi: boolean,
  initial: boolean,
  state: EditorState,
) {
  const { contentStore } = state;

  const referenceKeys: ContentKey[] = [];
  const variableContent: VariableContent = {
    type: ContentType.VARIABLE,
    key: nextKey(contentStore),
    parentKey,
    title: config?.title || '',
    description: config?.description || '',
    optional: false,
    typeId,
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
  if (blockContent.type !== ContentType.BLOCK) {
    throw new Error(
      `Attempted to add a new action on an illegal content type: ${blockContent.type}`,
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
    const parentType = parentContent.type;
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
    listContent.type !== ContentType.BLOCK &&
    listContent.type !== ContentType.ARGUMENT &&
    listContent.type !== ContentType.PROCESS
  ) {
    throw new Error(
      `Attempted to execute reorder operation on not-list state: ${listContent.type}`,
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

function findExecutableContent<T extends BlockContent | ControlContent | ActionContent>(
  contentStore: ContentStore,
  coordinates: number[],
): T {
  const processKey = contentStore.rootConfigKey as string;
  const process = resolveContent<ProcessContent>(processKey, contentStore.indexedContent);
  let pointer: ListContent = resolveContent<BlockContent>(
    process.rootBlockKey as string,
    contentStore.indexedContent,
  );
  for (let i = 0; i < coordinates.length; i++) {
    const coordinate = coordinates[i];
    const childKey = pointer.childKeys[coordinate];
    pointer = resolveContent<ListContent>(childKey, contentStore.indexedContent);
  }
  return pointer as T;
}

function resolveParameterSpecForInput(inputsContent: ArgumentContent, state: EditorState) {
  let { contentStore, engineSpec } = state;
  const parentContent = resolveContent<FunctionContent | ActionContent>(
    inputsContent.parentKey as string,
    contentStore.indexedContent,
  );
  const parameterName = Object.entries(parentContent.childKeyMap).find(
    ([, key]) => key === inputsContent.key,
  )?.[0] as string;
  const parentName = parentContent.name;
  return parentContent.type === ContentType.FUNCTION
    ? engineSpec.functions[parentName].inputs[parameterName]
    : (engineSpec.actions[parentName].inputs[parameterName] as ExpressionSpec);
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
  while (pointer.parentKey !== undefined && pointer.type !== ContentType.ARGUMENT) {
    pointer = resolveContent(pointer.parentKey as string, contentStore.indexedContent);
  }
  if (pointer.type !== ContentType.ARGUMENT) {
    throw new Error('Unexpected state structure encountered');
  }
  const argContent = pointer as ArgumentContent;
  const argParent = resolveContent<
    FunctionContent | ActionContent | ControlContent | ProcessContent
  >(argContent.parentKey as string, contentStore.indexedContent);

  const argName = Object.entries(argParent.childKeyMap).find(
    ([name, key]) => key === argContent.key,
  )?.[0];
  if (argName === undefined) {
    throw new Error(`Failed to find arg name for key ${argContent.key}`);
  }

  if (argParent.type === ContentType.FUNCTION) {
    const functionContent = argParent as FunctionContent;
    return engineSpec.functions[functionContent.name].inputs[argName];
  } else if (argParent.type === ContentType.ACTION) {
    const actionContent = argParent as ActionContent;
    return engineSpec.actions[actionContent.name].inputs[argName];
  } else if (argParent.type === ContentType.CONTROL && argName === CONDITIONAL_CONDITION_PROP) {
    return CONDITIONAL_CONTROL_SPEC.inputs[CONDITIONAL_CONDITION_PROP];
  } else if (argParent.type === ContentType.PROCESS && argName === PROCESS_RETURN_PROP) {
    const processContent = argParent as ProcessContent;
    return engineSpec.processes[processContent.name].output as ExpressionSpec;
  }
  throw new Error('Unexpected error: unable to resolve parameter spec');
}

function resolveTypeForReference(variableKey: ContentKey, path: string[], state: EditorState) {
  const {
    contentStore: { indexedContent },
    engineSpec: { types },
  } = state;

  const variableContent = resolveContent<VariableContent>(variableKey, indexedContent);
  let typeId = variableContent.typeId as string;
  let multi = variableContent.multi;
  for (let i = 0; i < path.length; i++) {
    const pathSegment = path[i];
    const property = types[typeId]?.properties[pathSegment];
    if (property === undefined) {
      throw new Error(`Failed to resolve path ${path.join('/')} for root type ${typeId}`);
    }
    typeId = property.typeId;
    multi = multi || property.multi;
  }
  return { typeId, multi };
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
  moveExecutable,
  updateVariable,
} = editorsSlice.actions;

export default editorsSlice.reducer;
