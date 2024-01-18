import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LOGICFORGE_REDUX_NAMESPACE, StoreStructure } from '../types';
import {
  ActionConfig,
  ActionSpec,
  ArgumentConfig,
  ConfigType,
  ValueConfig,
  ContentStore,
  ContentType,
  EngineSpec,
  FunctionConfig,
  FunctionSpec,
  InputConfig,
  LogicForgeConfig,
  ProcessConfig,
  SpecType,
} from '../../types';
import {
  addAction,
  addInput,
  deleteListItem,
  getContentAndAncestors,
  loadRootContent,
  reorderList,
  replaceInput,
  resolveParameterSpecForKey,
} from '../../util';

export type EditorState<CONFIG extends LogicForgeConfig, TYPE extends CONFIG['type']> = {
  type: TYPE;
  selection: string;
  engineSpec: EngineSpec;
  canonical?: CONFIG;
  contentStore: ContentStore;
};

export type EditorsState = {
  [editorId: string]: EditorState<any, any>;
};

const initialState: EditorsState = {};

const editorsSlice = createSlice({
  name: LOGICFORGE_REDUX_NAMESPACE.toString(),
  initialState,
  reducers: {
    initEditor: {
      reducer(
        state,
        action: PayloadAction<
          LogicForgeConfig,
          string,
          { engineSpecification: EngineSpec; editorId?: string }
        >,
      ) {
        const editorId = action.meta.editorId || Date.now().toString();
        let editorState = state[editorId];
        if (editorState === undefined) {
          const config = action.payload;
          const engineSpec = action.meta.engineSpecification;
          const contentStore: ContentStore = {
            editorId,
            count: 0,
            data: {},
          };
          loadRootContent(contentStore, config, engineSpec);
          editorState = {
            type: config.type,
            selection: contentStore.rootConfigKey as string,
            engineSpec,
            canonical: config,
            contentStore,
          };
          state[editorId] = editorState;
          return state;
        }
      },
      prepare(payload: ProcessConfig, engineSpecification: EngineSpec, editorId?: string) {
        return { payload, meta: { engineSpecification, editorId } };
      },
    },
    setSelection: {
      reducer(state, action: PayloadAction<string, string, { editorId: string }>) {
        const editorId = action.meta.editorId;
        const editorState = state[editorId];
        const key = action.payload;
        editorState.selection = key;
        return state;
      },
      prepare(payload: string, editorId: string) {
        return { payload, meta: { editorId } };
      },
    },
    setFunction: {
      reducer(state, action: PayloadAction<string, string, { editorId: string; key: string }>) {
        const editorId = action.meta.editorId;
        const editorState = state[editorId];
        const { engineSpec, contentStore, selection } = editorState;
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
          editorState.selection = selectedContent.parentKey as string;
          nodeWasSelected = true;
        }
        const newContent = replaceInput(contentStore, key, functionConfig, engineSpec);
        if (nodeWasSelected) {
          editorState.selection = newContent.key;
        }
        return state;
      },
      prepare(payload: string, editorId: string, key: string) {
        return { payload, meta: { editorId, key } };
      },
    },
    setValue: {
      reducer(state, action: PayloadAction<string, string, { editorId: string; key: string }>) {
        const editorId = action.meta.editorId;
        const { engineSpec: engineSpec, contentStore } = state[editorId];
        const value = action.payload;
        const valueConfig: ValueConfig = {
          type: ConfigType.VALUE,
          value,
        };
        const key = action.meta.key;
        replaceInput(contentStore, key, valueConfig, engineSpec);
        return state;
      },
      prepare(payload: string, editorId: string, key: string) {
        return { payload, meta: { editorId, key } };
      },
    },
    addValue: {
      reducer(state, action: PayloadAction<string, string, { editorId: string }>) {
        const editorId = action.meta.editorId;
        const editorState = state[editorId];
        const parentKey = action.payload;
        const engineSpec = editorState.engineSpec;
        const editorStateStore = editorState.contentStore;
        const valueConfig: ValueConfig = {
          type: ConfigType.VALUE,
          value: '',
        };
        addInput(editorStateStore, engineSpec, parentKey, valueConfig);
        return state;
      },
      prepare(payload: string, editorId: string) {
        return { payload, meta: { editorId } };
      },
    },
    addAction: {
      reducer(
        state,
        action: PayloadAction<string, string, { editorId: string; actionName: string }>,
      ) {
        const editorId = action.meta.editorId;
        const actionName = action.meta.actionName;
        const editorState = state[editorId];
        const parentKey = action.payload;
        const engineSpec = editorState.engineSpec;
        const editorStateStore = editorState.contentStore;
        const actionSpec = engineSpec.actions[actionName];
        const actionConfig = newActionConfigForSpec(actionName, actionSpec);
        addAction(editorStateStore, parentKey, actionConfig, engineSpec);
        return state;
      },
      prepare(payload: string, editorId: string, actionName: string) {
        return { payload, meta: { editorId, actionName } };
      },
    },
    reorderItem: {
      reducer(
        state,
        action: PayloadAction<
          string,
          string,
          { editorId: string; oldIndex: number; newIndex: number }
        >,
      ) {
        const editorId = action.meta.editorId;
        const editorState = state[editorId];
        const parentKey = action.payload;
        const editorStateStore = editorState.contentStore;
        reorderList(editorStateStore, parentKey, action.meta.oldIndex, action.meta.newIndex);
        return state;
      },
      prepare(payload: string, editorId: string, oldIndex: number, newIndex: number) {
        return { payload, meta: { editorId, oldIndex, newIndex } };
      },
    },
    deleteItem: {
      reducer(state, action: PayloadAction<string, string, { editorId: string }>) {
        const editorId = action.meta.editorId;
        const editorState = state[editorId];
        const selectedSubtree = getContentAndAncestors(
          editorState.contentStore,
          editorState.selection,
        );
        const keyToDelete = action.payload;
        const selectedContent = selectedSubtree.find((content) => content.key === keyToDelete);
        if (selectedContent !== undefined) {
          // If the content being deleted is also currently selected, we move the selection up to its parent node
          editorState.selection = selectedContent.parentKey as string;
        }
        const contentStore = editorState.contentStore;
        deleteListItem(contentStore, keyToDelete);
        return state;
      },
      prepare(payload: string, editorId: string) {
        return { payload, meta: { editorId } };
      },
    },
  },
});

export const selectEditorSelection = (state: StoreStructure, editorId: string) => {
  return state[LOGICFORGE_REDUX_NAMESPACE]?.[editorId]?.selection;
};

/**
 * Internal-only selector used for creating memoizable composite selectors
 * @param editorId
 */
const selectContentStore = (state: StoreStructure, editorId: string) => {
  return state[LOGICFORGE_REDUX_NAMESPACE]?.[editorId]?.contentStore;
};

export const selectSelectedSubtree = createSelector(
  [selectEditorSelection, selectContentStore],
  (selection, contentStore) => {
    if (selection !== undefined && contentStore !== undefined) {
      return getContentAndAncestors(contentStore, selection);
    }
  },
);

export const selectIsKeySelected = (editorId: string, key: string) => (state: StoreStructure) => {
  const editorState = state[LOGICFORGE_REDUX_NAMESPACE]?.[editorId];
  if (editorState !== undefined) {
    const contentStore = editorState.contentStore;
    const selectedContent = getContentAndAncestors(contentStore, editorState.selection);
    return selectedContent.find((content) => content.key == key) != undefined;
  }
  return false;
};

export const selectContentByKey = (editorId: string, key: string) => (state: StoreStructure) => {
  const editorStateStore = state[LOGICFORGE_REDUX_NAMESPACE]?.[editorId]?.contentStore;
  if (editorStateStore !== undefined) {
    return editorStateStore.data[key];
  }
};

export const selectParameterSpecificationForKey =
  (editorId: string, key?: string) => (state: StoreStructure) => {
    if (key !== undefined) {
      const editorStateStore = state[LOGICFORGE_REDUX_NAMESPACE]?.[editorId]?.contentStore;
      const engineSpecification = state[LOGICFORGE_REDUX_NAMESPACE]?.[editorId]?.engineSpec;
      if (editorStateStore !== undefined && engineSpecification !== undefined) {
        const state = editorStateStore.data[key];
        if (
          state.type === ContentType.VALUE ||
          state.type === ContentType.FUNCTION ||
          state.type === ContentType.INPUT_LIST
        ) {
          return resolveParameterSpecForKey(editorStateStore, engineSpecification, key);
        }
      }
    }
  };

function newFunctionConfigForSpec(functionName: string, spec: FunctionSpec): FunctionConfig {
  const argumentConfigs: { [key: string]: InputConfig[] } = {};
  Object.entries(spec.parameters).forEach(([key, value]) => {
    argumentConfigs[key] = [{ type: ConfigType.VALUE, value: '' }];
  });
  return {
    type: ConfigType.FUNCTION,
    name: functionName,
    arguments: argumentConfigs,
  };
}

function newActionConfigForSpec(actionName: string, spec: ActionSpec): ActionConfig {
  const inputArgumentConfigs: { [key: string]: InputConfig[] } = {};
  const actionArgumentConfigs: { [key: string]: ActionConfig[] } = {};
  Object.entries(spec.inputParameters).forEach(([key, value]) => {
    inputArgumentConfigs[key] = [{ type: ConfigType.VALUE, value: '' }];
  });
  Object.entries(spec.actionParameters).forEach(([key, value]) => {
    actionArgumentConfigs[key] = [];
  });

  return {
    type: ConfigType.ACTION,
    name: actionName,
    inputArguments: inputArgumentConfigs,
    actionArguments: actionArgumentConfigs,
  };
}

export const {
  initEditor,
  setSelection,
  setFunction,
  setValue,
  addValue,
  reorderItem,
  deleteItem,
} = editorsSlice.actions;

export default editorsSlice.reducer;
