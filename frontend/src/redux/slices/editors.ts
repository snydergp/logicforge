import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreStructure } from '../types';
import {
  ActionConfig,
  ActionSpec,
  ConditionalConfig,
  ConfigType,
  ContentStore,
  ContentType,
  ControlType,
  EngineSpec,
  ExpressionConfig,
  FunctionConfig,
  FunctionSpec,
  LogicForgeConfig,
  ProcessConfig,
  ValueConfig,
} from '../../types';
import {
  addInput,
  addNewExecutable,
  deleteListItem,
  getContentAndAncestors,
  loadRootContent,
  reorderList,
  replaceInput,
  resolveParameterSpecForKey,
} from '../../util';

export type EditorState = {
  selection: string;
  engineSpec: EngineSpec;
  contentStore: ContentStore;
};

const editorsSlice = createSlice({
  name: 'LOGICFORGE',
  initialState: {} as EditorState,
  reducers: {
    initEditor: {
      reducer(
        state,
        action: PayloadAction<LogicForgeConfig, string, { engineSpecification: EngineSpec }>,
      ) {
        const config = action.payload;
        const engineSpec = action.meta.engineSpecification;
        const contentStore: ContentStore = {
          count: 0,
          data: {},
        };
        loadRootContent(contentStore, config, engineSpec);
        state.selection = contentStore.rootConfigKey as string;
        state.engineSpec = engineSpec;
        state.contentStore = contentStore;
        return state;
      },
      prepare(payload: ProcessConfig, engineSpecification: EngineSpec) {
        return { payload, meta: { engineSpecification } };
      },
    },
    setSelection: {
      reducer(state, action: PayloadAction<string>) {
        const key = action.payload;
        const contentToSelect = state.contentStore.data[key];
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
    setFunction: {
      reducer(state, action: PayloadAction<string, string, { key: string }>) {
        const { engineSpec, contentStore, selection } = state;
        const functionName = action.payload;
        const functionConfig = newFunctionConfigForSpec(
          functionName,
          engineSpec.functions[functionName],
        );
        const key = action.meta.key;
        const selectedSubtree = getContentAndAncestors(contentStore, selection);
        const selectedContent = selectedSubtree.find((content) => content.key === key);
        let nodeWasSelected = false;
        if (selectedContent !== undefined) {
          // If the content being deleted is also currently selected, we move the selection up to its parent node
          state.selection = selectedContent.parentKey as string;
          nodeWasSelected = true;
        }
        const newContent = replaceInput(contentStore, key, functionConfig, engineSpec);
        if (nodeWasSelected) {
          state.selection = newContent.key;
        }
        return state;
      },
      prepare(payload: string, key: string) {
        return { payload, meta: { key } };
      },
    },
    setValue: {
      reducer(state, action: PayloadAction<string, string, { key: string }>) {
        const { engineSpec, contentStore } = state;
        const value = action.payload;
        const valueConfig: ValueConfig = {
          type: ConfigType.VALUE,
          value,
        };
        const key = action.meta.key;
        replaceInput(contentStore, key, valueConfig, engineSpec);
        return state;
      },
      prepare(payload: string, key: string) {
        return { payload, meta: { key } };
      },
    },
    addValue: {
      reducer(state, action: PayloadAction<string>) {
        const parentKey = action.payload;
        const engineSpec = state.engineSpec;
        const editorStateStore = state.contentStore;
        const valueConfig: ValueConfig = {
          type: ConfigType.VALUE,
          value: '',
        };
        addInput(editorStateStore, engineSpec, parentKey, valueConfig);
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
        const engineSpec = state.engineSpec;
        const editorStateStore = state.contentStore;
        let config;
        if (type === ContentType.ACTION) {
          const actionSpec = engineSpec.actions[name];
          config = newActionConfigForSpec(name, actionSpec);
        } else {
          config = newConditionalConfig();
        }
        const newKey = addNewExecutable(editorStateStore, parentKey, config, engineSpec);
        state.selection = newKey;
        return state;
      },
      prepare(payload: string, name: string, type: ContentType.CONTROL | ContentType.ACTION) {
        return { payload, meta: { name, type } };
      },
    },
    reorderItem: {
      reducer(
        state,
        action: PayloadAction<string, string, { oldIndex: number; newIndex: number }>,
      ) {
        const parentKey = action.payload;
        const editorStateStore = state.contentStore;
        reorderList(editorStateStore, parentKey, action.meta.oldIndex, action.meta.newIndex);
        return state;
      },
      prepare(payload: string, oldIndex: number, newIndex: number) {
        return { payload, meta: { oldIndex, newIndex } };
      },
    },
    deleteItem: {
      reducer(state, action: PayloadAction<string>) {
        const { contentStore, selection, engineSpec } = state;
        const selectedSubtree = getContentAndAncestors(contentStore, selection);
        const keyToDelete = action.payload;
        const selectedContent = selectedSubtree.find((content) => content.key === keyToDelete);
        const parentKey = selectedContent?.parentKey;
        if (selectedContent !== undefined && parentKey !== undefined) {
          // If the content being deleted is also currently selected, we move the selection up to its parent node
          state.selection = parentKey;
        }
        const contentToDelete = contentStore.data[keyToDelete];
        deleteListItem(contentStore, keyToDelete);
        if (contentToDelete.type !== ContentType.ACTION) {
          const parameterSpec = resolveParameterSpecForKey(contentStore, engineSpec, keyToDelete);
          if (parameterSpec.multi && parentKey !== undefined) {
            const valueConfig: ValueConfig = {
              type: ConfigType.VALUE,
              value: '',
            };
            addInput(contentStore, engineSpec, parentKey, valueConfig);
          }
        }
        return state;
      },
      prepare(payload: string) {
        return { payload };
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

export const selectContentByKey = (key: string) => (state: StoreStructure) => {
  const editorStateStore = state['LOGICFORGE']?.contentStore;
  if (editorStateStore !== undefined) {
    return editorStateStore.data[key];
  }
};

export const selectParameterSpecificationForKey = (key?: string) => (state: StoreStructure) => {
  if (key !== undefined) {
    const editorStateStore = state['LOGICFORGE']?.contentStore;
    const engineSpecification = state['LOGICFORGE']?.engineSpec;
    if (editorStateStore !== undefined && engineSpecification !== undefined) {
      const state = editorStateStore.data[key];
      if (
        state !== undefined &&
        (state.type === ContentType.VALUE ||
          state.type === ContentType.FUNCTION ||
          state.type === ContentType.EXPRESSION_LIST)
      ) {
        return resolveParameterSpecForKey(editorStateStore, engineSpecification, key);
      }
    }
  }
};

function newFunctionConfigForSpec(functionName: string, spec: FunctionSpec): FunctionConfig {
  const argumentConfigs: { [key: string]: ExpressionConfig[] } = {};
  Object.entries(spec.inputs).forEach(([key, value]) => {
    argumentConfigs[key] = [{ type: ConfigType.VALUE, value: '' }];
  });
  return {
    type: ConfigType.FUNCTION,
    name: functionName,
    arguments: argumentConfigs,
  };
}

function newActionConfigForSpec(actionName: string, spec: ActionSpec): ActionConfig {
  const inputArgumentConfigs: { [key: string]: ExpressionConfig[] } = {};
  Object.entries(spec.inputs).forEach(([key, value]) => {
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

export const {
  initEditor,
  setSelection,
  setFunction,
  setValue,
  addValue,
  addExecutable,
  reorderItem,
  deleteItem,
} = editorsSlice.actions;

export default editorsSlice.reducer;
