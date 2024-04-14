import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreStructure } from '../types';
import {
  ActionConfig,
  ActionContent,
  ActionSpec,
  ArgumentContent,
  BlockConfig,
  BlockContent,
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
  ListContent,
  LogicForgeConfig,
  ProcessConfig,
  ProcessContent,
  ReferenceConfig,
  ReferenceContent,
  validateValue,
  ValidationError,
  ValueConfig,
  ValueContent,
  VariableConfig,
  VariableContent,
} from '../../types';
import {
  areCoordinatesPredecessor,
  collectSubtypes,
  Coordinates,
  generateTypeMapping,
  getCoordinatesSharedAncestor,
  TypeMapping,
} from '../../util';
import { WellKnownType } from '../../constant/well-known-type';
import { MetadataProperties } from '../../constant/metadata-properties';

export type EditorState = {
  selection: string;
  engineSpec: EngineSpec;
  contentStore: ContentStore;
  typeMapping: TypeMapping;
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
          data: {},
          rootConfigKey: '',
        };
        state.contentStore = contentStore;
        state.typeMapping = generateTypeMapping(engineSpec.types);
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
        const contentToSelect = contentStore.data[key];
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
      reducer(state, action: PayloadAction<string, string, { variableKey: string }>) {
        const { variableKey } = action.meta;
        const key = action.payload;
        replaceValueWithReference(key, variableKey, state);
        return state;
      },
      prepare(key: string, variableKey: string) {
        return { payload: key, meta: { variableKey } };
      },
    },
    setValue: {
      reducer(state, action: PayloadAction<string, string, { key: string }>) {
        const { contentStore } = state;
        const value = action.payload;
        const key = action.meta.key;
        const valueContent = resolveContent<ValueContent>(key, contentStore);
        valueContent.value = value;
        return state;
      },
      prepare(payload: string, key: string) {
        return { payload, meta: { key } };
      },
    },
    addInputValue: {
      reducer(state, action: PayloadAction<string>) {
        const parentKey = action.payload;
        addNewValue(parentKey, '', state);
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
        reorderList(contentStore, parentKey, action.meta.oldIndex, action.meta.newIndex);
        return state;
      },
      prepare(payload: string, oldIndex: number, newIndex: number) {
        return { payload, meta: { oldIndex, newIndex } };
      },
    },
    deleteItem: {
      reducer(state, action: PayloadAction<string>) {
        const { contentStore, selection } = state;
        const selectedSubtree = getContentAndAncestors(contentStore, selection);
        const keyToDelete = action.payload;
        const selectedContent = selectedSubtree.find((content) => content.key === keyToDelete);
        const parentKey = selectedContent?.parentKey;
        if (selectedContent !== undefined && parentKey !== undefined) {
          // If the content being deleted is also currently selected, we move the selection up to its parent node
          state.selection = parentKey as string;
        }
        const contentToDelete = contentStore.data[keyToDelete];
        deleteListItem(keyToDelete, contentStore);
        if (
          contentToDelete.type !== ContentType.ACTION &&
          contentToDelete.type !== ContentType.CONTROL
        ) {
          const parameterSpec = resolveParameterSpecForKey(keyToDelete, state);
          if (parameterSpec.multi && parentKey !== undefined) {
            const valueConfig: ValueConfig = {
              type: ConfigType.VALUE,
              value: '',
            };
            addInput(parentKey as string, valueConfig, state);
          }
        }
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
  (selection, contentStore) => {
    if (selection !== undefined && contentStore !== undefined) {
      return getContentAndAncestors(contentStore, selection);
    }
  },
);

export const selectContentByKey = (key?: string) => (state: StoreStructure) => {
  if (key !== undefined) {
    const contentStore = state['LOGICFORGE']?.contentStore;
    if (contentStore !== undefined) {
      return contentStore.data[key];
    }
  }
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

function nextKey(contentStore: ContentStore) {
  return `${contentStore.count++}`;
}

function resolveContent<T extends Content | undefined>(key: string, contentStore: ContentStore): T {
  return contentStore.data[key] as T;
}

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

function addNewValue(parentKey: string, value: string, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const argumentContent = resolveContent<ArgumentContent>(parentKey, contentStore);
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
    multi: false,
    value,
    typeId,
    availableFunctionIds,
    availableVariables,
    errors: validateValue(value, typeId, engineSpec),
  } as ValueContent;
  contentStore.data[valueContent.key] = valueContent;
  return valueContent;
}

function replaceValueWithReference(
  valueKey: ContentKey,
  variableKey: ContentKey,
  state: EditorState,
) {
  const { contentStore, selection } = state;
  const existingValueContent = resolveContent<ValueContent>(valueKey, contentStore);
  const parentArgContent = resolveContent<ArgumentContent>(
    existingValueContent.parentKey as string,
    contentStore,
  );
  const variableContent = resolveContent<VariableContent>(variableKey, contentStore);
  const referenceKey = nextKey(contentStore);
  contentStore.data[referenceKey] = {
    key: referenceKey,
    type: ContentType.REFERENCE,
    parentKey: existingValueContent.parentKey,
    referenceKey: variableKey,
    path: [],
    errors: [], // TODO validate initial state
    typeId: variableContent.typeId,
    multi: variableContent.multi,
  } as ReferenceContent;
  const oldIndex = parentArgContent.childKeys.indexOf(valueKey);
  parentArgContent.childKeys[oldIndex] = referenceKey;
  recursiveDelete(contentStore, valueKey);
  variableContent.referenceKeys.push(referenceKey);
  if (selection === valueKey) {
    state.selection = referenceKey;
  }
}

function replaceValueWithFunction(valueKey: ContentKey, functionName: string, state: EditorState) {
  const { engineSpec, contentStore, selection, typeMapping } = state;

  const existingValueContent = resolveContent<ValueContent>(valueKey, contentStore);
  const existingArgContent = resolveContent<ArgumentContent>(
    existingValueContent.parentKey as string,
    contentStore,
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
  contentStore.data[functionKey] = functionContent;

  existingArgContent.childKeys[existingIndex] = functionKey;

  const dynamicReturnProperty = functionSpec.metadata[MetadataProperties.DYNAMIC_RETURN_TYPE];

  Object.entries(functionSpec.inputs).forEach(([inputName, inputSpec]) => {
    const argKey = nextKey(contentStore);
    const typeId = inputSpec.typeId;
    contentStore.data[argKey] = {
      key: argKey,
      type: ContentType.ARGUMENT,
      parentKey: functionKey,
      errors: [],
      allowMulti: inputSpec.multi,
      declaredTypeId: typeId,
      calculatedTypeId: typeId,
      propagateTypeChanges: inputName === dynamicReturnProperty,
      allowedTypeIds: [...typeMapping[typeId].subtypes],
      childKeys: [],
    } as ArgumentContent;
    functionContent.childKeyMap[inputName] = argKey;

    addNewValue(argKey, '', state);
  });
  if (selection === valueKey) {
    state.selection = functionKey;
  }
}

function propagateTypeUpdate(expressionKey: string, state: EditorState) {
  const { contentStore } = state;
  const updatedExpression = resolveContent<ExpressionContent>(expressionKey, contentStore);
  const typeId = updatedExpression.typeId as string;
  const multi = updatedExpression.multi;
  const parentArgument = resolveContent<ArgumentContent>(
    updatedExpression.parentKey as string,
    contentStore,
  );
  parentArgument.calculatedTypeId = typeId;
  const parent = resolveContent<FunctionContent | ActionContent>(
    parentArgument.parentKey as string,
    contentStore,
  );
  if (parentArgument.allowedTypeIds.indexOf(typeId) < 0 || (multi && !parentArgument.allowMulti)) {
    ensureErrorByCode(parent.errors, {
      code: ErrorCode.UNSATISFIED_INPUT,
      level: ErrorLevel.ERROR,
      data: {},
    });
  } else {
    removeErrorsByCode(parent.errors, ErrorCode.UNSATISFIED_INPUT);
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
            contentStore,
          );
          variableContent.typeId = typeId;
          variableContent.multi = multi;
          variableContent.referenceKeys.forEach((referenceKey) => {
            const referenceContent = resolveContent<ReferenceContent>(referenceKey, contentStore);
            referenceContent.typeId = typeId;
            referenceContent.multi = multi;
            propagateTypeUpdate(referenceKey, state);
          });
        }
      }
    }
  }
}

/**
 * To be called when a change has been made to an action that might impact references to its output.
 * For example, if it is moved. The current implementation performs a re-scan of all content and
 * adds reference options where the reference becomes available (and sets errors if it is referenced
 * somewhere where it is no longer available).
 * @param updatedActionKey
 * @param contentStore
 */
function fixVariableReferences(updatedActionKey: string, contentStore: ContentStore) {
  // TODO:
  //  - get the action's output variable
  //  - collect all references to the action
  //  - if it exists, collect all references to the action, for each
  //    - ensure the type matches the new type
  //      - if changing type, propagate if necessary
  //      - if changing type, ensure path is acceptable
  //    - ensure the variable is reachable
  //      - if not, set errors
  //  - recalculate the available variables for all values
  const actionCoordinates = getCoordinatesForContent(updatedActionKey, contentStore);
  const actionContent = resolveContent<ActionContent>(updatedActionKey, contentStore);
  const actionVariableKey = actionContent.variableContentKey;
  const actionVariableContent =
    actionVariableKey !== undefined
      ? resolveContent<VariableContent>(actionVariableKey, contentStore)
      : undefined;
  const actionVariableTypeId =
    actionVariableContent !== undefined ? actionVariableContent.typeId : null;
  const actionVariableMulti =
    actionVariableContent !== undefined ? actionVariableContent.multi : false;

  const values: ValueContent[] = [];
  const references: ReferenceContent[] = [];
  recurseDown(
    contentStore,
    (content) => {
      if (content.type === ContentType.VALUE) {
        values.push(content as ValueContent);
      } else if (content.type === ContentType.REFERENCE) {
        references.push(content as ReferenceContent);
      }
    },
    contentStore.rootConfigKey as string,
  );
  values.forEach((valueContent) => {
    const valueCoordinates = getCoordinatesForContent(valueContent.key, contentStore);
    let foundIndex: number | undefined;
    for (let i = 0; i < valueContent.availableVariables.length; i++) {
      const availableVariableRef = valueContent.availableVariables[i];
      if (availableVariableRef.key === actionVariableKey) {
        foundIndex = i;
        break;
      }
    }
    const relationship = findVariableRelationship(valueCoordinates, actionCoordinates);
    switch (relationship) {
      case VariableRelationship.UNREACHABLE:
        if (foundIndex !== undefined) {
          valueContent.availableVariables.splice(foundIndex, 1);
        }
        break;
      case VariableRelationship.CONDITIONAL:
        if (foundIndex !== undefined) {
          valueContent.availableVariables[foundIndex].conditional = true;
        } else if (actionVariableKey !== undefined) {
          valueContent.availableVariables.push({ key: actionVariableKey, conditional: true });
        }
        break;
      case VariableRelationship.REACHABLE:
        if (foundIndex !== undefined) {
          valueContent.availableVariables[foundIndex].conditional = false;
        } else if (actionVariableKey !== undefined) {
          valueContent.availableVariables.push({ key: actionVariableKey, conditional: false });
        }
        break;
    }
  });
  references.forEach((referenceContent) => {
    referenceContent.typeId = actionVariableTypeId as string;
    referenceContent.multi = actionVariableMulti;
    const referenceCoordinates = getCoordinatesForContent(referenceContent.key, contentStore);
    const referencedVarKey = referenceContent.referenceKey;
    const referencedCoordinates = getCoordinatesForContent(referencedVarKey, contentStore);
    const relationship = findVariableRelationship(referenceCoordinates, referencedCoordinates);
    if (relationship === VariableRelationship.UNREACHABLE) {
      removeErrorsByCode(referenceContent.errors, ErrorCode.UNCHECKED_REFERENCE);
      ensureErrorByCode(referenceContent.errors, {
        code: ErrorCode.INVALID_REFERENCE,
        level: ErrorLevel.ERROR,
        data: {},
      });
    } else if (relationship === VariableRelationship.CONDITIONAL) {
      removeErrorsByCode(referenceContent.errors, ErrorCode.INVALID_REFERENCE);
      const conditionalReferences: ConditionalReferenceContent[] = [];
      recurseUp(
        contentStore,
        (content) => {
          if (content.type === ContentType.CONDITIONAL_REFERENCE) {
            conditionalReferences.push(content as ConditionalReferenceContent);
          }
        },
        referenceContent.key,
      );
      let isWrapped = false;
      for (let conditionalReference of conditionalReferences) {
        if (conditionalReference.childKeys.indexOf(referencedVarKey) >= 0) {
          isWrapped = true;
          break;
        }
      }
      if (isWrapped) {
        removeErrorsByCode(referenceContent.errors, ErrorCode.UNCHECKED_REFERENCE);
      }
    } else {
      removeErrorsByCode(referenceContent.errors, ErrorCode.UNCHECKED_REFERENCE);
      removeErrorsByCode(referenceContent.errors, ErrorCode.INVALID_REFERENCE);
    }
  });
}

function doUpdateValue(value: string, key: string, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const valueContent = resolveContent<ValueContent>(key, contentStore);
  const { typeId, errors } = valueContent;
  valueContent.value = value;
  const newErrors = validateValue(value, typeId as string, engineSpec);
  // Replace any existing INVALID_VALUE errors with any new errors found
  removeErrorsByCode(errors, ErrorCode.INVALID_VALUE);
  errors.push(...newErrors);
}

function doUpdateValueType(newTypeId: string, key: string, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const valueContent = resolveContent<ValueContent>(key, contentStore);
  const argumentContent = resolveContent<ArgumentContent>(
    valueContent.parentKey as string,
    contentStore,
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
  const executableContent = resolveContent<ExecutableContent>(key, contentStore);
  const oldParentKey = executableContent.parentKey as string;
  const oldParentBlock = resolveContent<BlockContent>(oldParentKey, contentStore);
  removeChildKey(oldParentBlock, key);
  const newParentBlock =
    oldParentKey === newParentKey
      ? oldParentBlock
      : resolveContent<BlockContent>(newParentKey, contentStore);
  addChildKey(newParentBlock, key, newIndex);
  executableContent.parentKey = newParentKey;
}

function doUpdateVariable(key: string, title: string, description: string, state: EditorState) {
  const { contentStore } = state;
  const variableContent = resolveContent<VariableContent>(key, contentStore);
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
  const { engineSpec, typeMapping } = state;
  const matchingFunctions: { [key: string]: FunctionSpec } = {};
  if (typeMapping !== undefined && engineSpec !== undefined) {
    const subtypes = collectSubtypes(typeId, typeMapping);
    Object.entries(engineSpec.functions).forEach(([key, functionSpec]) => {
      const functionOutput = functionSpec.output;
      const functionOutputTypeId = functionOutput.typeId;
      // function output must be of the same type or able to be converted/coerced into the type
      if (subtypes[functionOutputTypeId] !== undefined) {
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
  const variables: VariableModel[] = [];

  let rootActionContent: ExecutableContent | undefined;
  recurseUp(
    contentStore,
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
  if (rootActionContent === undefined) {
    throw new Error(`Illegal content configuration: key ${key} is not a descendant of any action`);
  }

  const rootContent = resolveContent<ProcessContent>(
    contentStore.rootConfigKey as string,
    contentStore,
  );
  for (let inputVariableKey of rootContent.inputVariableKeys) {
    const inputVariableContent = resolveContent<VariableContent>(inputVariableKey, contentStore);
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
        contentStore,
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
    if (controlContent.controlType !== ControlType.CONDITIONAL) {
      throw new Error(`Unknown control type: ${controlContent.controlType}`);
    }
    const conditionalContent = controlContent as ConditionalContent;
    const thenBlockContent = resolveContent<BlockContent>(
      conditionalContent.childKeys[0],
      contentStore,
    );
    const elseBlockContent = resolveContent<BlockContent>(
      conditionalContent.childKeys[0],
      contentStore,
    );
    const allChildKeys = [...thenBlockContent.childKeys, ...elseBlockContent.childKeys];
    return allChildKeys
      .map((key) => {
        const executableContent = resolveContent<ExecutableContent>(key, contentStore);
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

  let childContent: ExecutableContent = rootActionContent;
  let parentBlock = resolveContent<BlockContent>(childContent.parentKey as string, contentStore);
  let childIndex = parentBlock.childKeys.indexOf(childContent.key);
  while (true) {
    for (let i = childIndex - 1; i >= 0; i--) {
      const siblingContent = resolveContent<ExecutableContent>(
        parentBlock.childKeys[i],
        contentStore,
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
      contentStore,
    );
    if (grandparentContent.type === ContentType.CONTROL) {
      childContent = grandparentContent as ControlContent;
      parentBlock = resolveContent<BlockContent>(childContent.key, contentStore);
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

function getCoordinatesForContent(contentKey: string, contentStore: ContentStore) {
  let rootActionContent: ActionContent | undefined;
  recurseUp(
    contentStore,
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
  recurseUp(contentStore, visitContent, contentKey);
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
    errors: [],
  };
  contentStore.data[processContent.key] = processContent;

  // set process as root content
  contentStore.rootConfigKey = processKey;

  // construct root block and link to process
  const rootBlockContent = constructBlock(config.rootBlock, processKey, state);
  rootBlockContent.parentKey = processKey;
  processContent.rootBlockKey = rootBlockContent.key;

  // if process has return, define the return arg content and link to process
  const returnArgContent =
    config.returnExpression !== undefined && outputTypeId !== undefined
      ? constructArgument([config.returnExpression], processKey, outputTypeId, outputMulti, state)
      : undefined;
  if (returnArgContent !== undefined) {
    returnArgContent.parentKey = processKey;
    processContent.returnArgumentKey = returnArgContent.key;
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
      const variableContent = constructVariable(variableConfig, processKey, typeId, multi, state);
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
  const { contentStore, typeMapping } = state;
  const declaredTypeId = typeId;
  const allowedTypeIds = [...typeMapping[declaredTypeId].subtypes];
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
  contentStore.data[key] = argContent;

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
  contentStore.data[blockKey] = blockContent;

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
  contentStore.data[controlStatementKey] = conditionalContent;

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
  const { value } = config;
  const argContent = resolveContent<ArgumentContent>(parentKey, contentStore);
  let typeId = argContent.declaredTypeId;
  if (typeId === WellKnownType.OBJECT) {
    // default new values of unspecified type to string input mode
    typeId = WellKnownType.STRING;
  }

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
    errors: [],
  } as ValueContent;
  contentStore.data[valueContent.key] = valueContent;

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
  contentStore.data[actionContent.key] = actionContent;

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
      ? constructVariable(config.output, key, calculatedTypeId, multi, state)
      : undefined;
  if (varContent !== undefined) {
    actionContent.variableContentKey = varContent.key;
  }

  return actionContent;
}

function constructFunction(config: FunctionConfig, parentKey: ContentKey, state: EditorState) {
  const { contentStore, engineSpec } = state;
  const key = nextKey(contentStore);
  const name = config.name;
  const spec = engineSpec.functions[name];

  const outputTypeInputName = spec.metadata[MetadataProperties.DYNAMIC_RETURN_TYPE];
  let calculatedTypeId = spec.output?.typeId || null;
  const multi = spec.output?.multi || false;

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
  contentStore.data[functionContent.key] = functionContent;

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
  const parentArg = resolveContent<ArgumentContent>(parentKey, contentStore);
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
  contentStore.data[referenceKey] = referenceContent;

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
      contentStore,
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
    contentStore,
  );
  const referenceContent: ReferenceContent = {
    type: ContentType.REFERENCE,
    key: nextKey(contentStore),
    parentKey,
    referenceKey: referencedContent.variableContentKey as string,
    typeId: referencedContent.typeId,
    multi: referencedContent.multi,
    path: ref.path,
    errors: [],
  };
  variableContent.referenceKeys.push(referenceContent.key);
  contentStore.data[referenceContent.key] = referenceContent;
  return referenceContent;
}

function constructVariable(
  config: VariableConfig | undefined,
  parentKey: ContentKey,
  typeId: string,
  multi: boolean,
  state: EditorState,
) {
  const { contentStore } = state;
  const variableContent: VariableContent = {
    type: ContentType.VARIABLE,
    key: nextKey(contentStore),
    parentKey,
    title: config?.title || '',
    description: config?.description || '',
    optional: false,
    typeId,
    multi,
    referenceKeys: [],
    errors: [],
  };
  contentStore.data[variableContent.key] = variableContent;
  return variableContent;
}

/**
 * This function removes all descendants of a deleted parent node from the store to avoid memory leaks. This function
 * does not remove this state as a child reference from any parent node -- this should be done by the caller. Also note
 * that this function only deletes the descendant states from the store, it does not remove their links to each other.
 * @param contentStore the store from which the state should be deleted
 * @param stateKeyToDelete the key for the state to be recursively deleted from the store
 */
export function recursiveDelete(contentStore: ContentStore, stateKeyToDelete: string) {
  recurseDown(
    contentStore,
    (state) => {
      if (contentStore.data.hasOwnProperty(state.key)) {
        delete contentStore.data[state.key];
      }
    },
    stateKeyToDelete,
    true,
  );
}

export function addNewExecutable(
  parentKey: string,
  newConfig: ActionConfig | ControlConfig,
  state: EditorState,
) {
  let { contentStore } = state;
  const blockContent = resolveContent<BlockContent>(parentKey, contentStore);
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
  const content = resolveContent(key, contentStore);
  if (content !== undefined) {
    const parentKey = content.parentKey as string;
    const parentContent = resolveContent<BlockContent | ArgumentContent>(parentKey, contentStore);
    const parentType = parentContent.type;
    if (parentType !== ContentType.BLOCK && parentType !== ContentType.ARGUMENT) {
      throw new Error(
        `Attempted to delete a list item from an illegal parent content type: ${parentType}`,
      );
    }
    const currentIndex = parentContent.childKeys.indexOf(key);
    parentContent.childKeys.splice(currentIndex, 1);
    recursiveDelete(contentStore, key);
  }
}

export function addInput(
  parentKey: string,
  newConfig: FunctionConfig | ValueConfig,
  state: EditorState,
) {
  let { contentStore } = state;
  const content = resolveContent<ArgumentContent>(parentKey, contentStore);
  if (content.type !== ContentType.ARGUMENT) {
    throw new Error(`Attempted to add a new input on an illegal content type: ${content.type}`);
  }
  const expressionList: ArgumentContent = content as ArgumentContent;
  const parameterSpec = resolveParameterSpecForInput(expressionList, state);
  if (!parameterSpec.multi) {
    throw new Error(`Attempted to add an additional value to a non-multi parameter`);
  }
  const newChildState = constructExpression(newConfig, parentKey, state);
  newChildState.parentKey = expressionList.key;
  expressionList.childKeys.push(newChildState.key);
}

export function reorderList(
  contentStore: ContentStore,
  parentKey: string,
  oldIndex: number,
  newIndex: number,
) {
  const listContent = resolveContent<ListContent>(parentKey, contentStore);
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
    contentStore,
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
  const process = resolveContent<ProcessContent>(processKey, contentStore);
  let pointer: ListContent = resolveContent<BlockContent>(
    process.rootBlockKey as string,
    contentStore,
  );
  for (let i = 0; i < coordinates.length; i++) {
    const coordinate = coordinates[i];
    const childKey = pointer.childKeys[coordinate];
    pointer = resolveContent<ListContent>(childKey, contentStore);
  }
  return pointer as T;
}

function resolveParameterSpecForInput(inputsContent: ArgumentContent, state: EditorState) {
  let { contentStore, engineSpec } = state;
  const parentContent = resolveContent<FunctionContent | ActionContent>(
    inputsContent.parentKey as string,
    contentStore,
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
    resolveContent<ArgumentContent | FunctionContent | ValueContent>(key, contentStore),
    state,
  );
}

export function resolveParameterSpec(
  expressionContent: ArgumentContent | FunctionContent | ValueContent,
  state: EditorState,
) {
  const { contentStore } = state;
  let pointer: Content = expressionContent;
  while (pointer.parentKey !== undefined && pointer.type !== ContentType.ARGUMENT) {
    pointer = resolveContent(pointer.parentKey as string, contentStore);
  }
  if (pointer.type !== ContentType.ARGUMENT) {
    throw new Error('Unexpected state structure encountered');
  }
  const argContent = pointer as ArgumentContent;
  return {
    typeId: argContent.declaredTypeId,
    multi: argContent.allowMulti,
  };
}

/**
 * Utility method for traversing up the content tree
 * @param contentStore the store
 * @param func a function to execute against each node
 * @param initialKey the key representing the node to start recursing at
 * @param ancestorsFirst execute the function starting with the root node and working down to the node represented by the supplied key
 */
function recurseUp(
  contentStore: ContentStore,
  func: (state: Content) => void,
  initialKey: string,
  ancestorsFirst: boolean = false,
) {
  const content = resolveContent(initialKey, contentStore);
  if (content === undefined) {
    return;
  }

  if (!ancestorsFirst) {
    func(content);
  }

  if (content.parentKey !== undefined) {
    recurseUp(contentStore, func, content.parentKey as string, ancestorsFirst);
  }

  if (ancestorsFirst) {
    func(content);
  }
}

/**
 * Utility method for traversing down the content tree
 * @param contentStore the store
 * @param func a function to execute against each node
 * @param initialKey the key representing the node to start recursing at
 * @param descendantsFirst execute the function starting with descendants and working up to the node represented by the supplied key
 */
function recurseDown(
  contentStore: ContentStore,
  func: (state: Content) => void,
  initialKey: string,
  descendantsFirst: boolean = false,
) {
  const content = resolveContent(
    initialKey || (contentStore.rootConfigKey as string),
    contentStore,
  );
  if (content === undefined) {
    return;
  }

  if (!descendantsFirst) {
    func(content);
  }

  switch (content.type) {
    case ContentType.FUNCTION:
      const functionContent = content as FunctionContent;
      Object.entries(functionContent.childKeyMap).forEach(([, childKey]) => {
        recurseDown(contentStore, func, childKey, descendantsFirst);
      });
      break;
    case ContentType.ACTION:
      const actionContent = content as ActionContent;
      Object.entries(actionContent.childKeyMap).forEach(([, childKey]) => {
        recurseDown(contentStore, func, childKey, descendantsFirst);
      });
      break;
    case ContentType.PROCESS:
    case ContentType.BLOCK:
    case ContentType.ARGUMENT:
      const listContent = content as ListContent;
      listContent.childKeys.forEach((childKey) => {
        recurseDown(contentStore, func, childKey, descendantsFirst);
      });
      break;
    case ContentType.VALUE:
      // no children
      break;
  }

  if (descendantsFirst) {
    func(content);
  }
}

export const {
  initEditor,
  setSelection,
  convertValueToFunction,
  convertValueToReference,
  setValue,
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
