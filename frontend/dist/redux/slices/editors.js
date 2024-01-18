import { createSelector, createSlice } from '@reduxjs/toolkit';
import { LOGICFORGE_REDUX_NAMESPACE } from '../types';
import { ConfigType, ContentType, } from '../../types';
import { addAction, addInput, deleteListItem, getContentAndAncestors, loadRootContent, reorderList, replaceInput, resolveParameterSpecForKey, } from '../../util';
const initialState = {};
const editorsSlice = createSlice({
    name: LOGICFORGE_REDUX_NAMESPACE.toString(),
    initialState,
    reducers: {
        initEditor: {
            reducer(state, action) {
                const editorId = action.meta.editorId || Date.now().toString();
                let editorState = state[editorId];
                if (editorState === undefined) {
                    const config = action.payload;
                    const engineSpec = action.meta.engineSpecification;
                    const contentStore = {
                        editorId,
                        count: 0,
                        data: {},
                    };
                    loadRootContent(contentStore, config, engineSpec);
                    editorState = {
                        type: config.type,
                        selection: contentStore.rootConfigKey,
                        engineSpec,
                        canonical: config,
                        contentStore,
                    };
                    state[editorId] = editorState;
                    return state;
                }
            },
            prepare(payload, engineSpecification, editorId) {
                return { payload, meta: { engineSpecification, editorId } };
            },
        },
        setSelection: {
            reducer(state, action) {
                const editorId = action.meta.editorId;
                const editorState = state[editorId];
                const key = action.payload;
                editorState.selection = key;
                return state;
            },
            prepare(payload, editorId) {
                return { payload, meta: { editorId } };
            },
        },
        setFunction: {
            reducer(state, action) {
                const editorId = action.meta.editorId;
                const editorState = state[editorId];
                const { engineSpec, contentStore, selection } = editorState;
                const functionName = action.payload;
                const functionConfig = newFunctionConfigForSpec(functionName, engineSpec.functions[functionName]);
                const key = action.meta.key;
                const selectedSubtree = getContentAndAncestors(contentStore, selection);
                const selectedContent = selectedSubtree.find((content) => content.key === key);
                let nodeWasSelected = false;
                if (selectedContent !== undefined) {
                    // If the content being deleted is also currently selected, we move the selection up to its parent node
                    editorState.selection = selectedContent.parentKey;
                    nodeWasSelected = true;
                }
                const newContent = replaceInput(contentStore, key, functionConfig, engineSpec);
                if (nodeWasSelected) {
                    editorState.selection = newContent.key;
                }
                return state;
            },
            prepare(payload, editorId, key) {
                return { payload, meta: { editorId, key } };
            },
        },
        setValue: {
            reducer(state, action) {
                const editorId = action.meta.editorId;
                const { engineSpec: engineSpec, contentStore } = state[editorId];
                const value = action.payload;
                const valueConfig = {
                    type: ConfigType.VALUE,
                    value,
                };
                const key = action.meta.key;
                replaceInput(contentStore, key, valueConfig, engineSpec);
                return state;
            },
            prepare(payload, editorId, key) {
                return { payload, meta: { editorId, key } };
            },
        },
        addValue: {
            reducer(state, action) {
                const editorId = action.meta.editorId;
                const editorState = state[editorId];
                const parentKey = action.payload;
                const engineSpec = editorState.engineSpec;
                const editorStateStore = editorState.contentStore;
                const valueConfig = {
                    type: ConfigType.VALUE,
                    value: '',
                };
                addInput(editorStateStore, engineSpec, parentKey, valueConfig);
                return state;
            },
            prepare(payload, editorId) {
                return { payload, meta: { editorId } };
            },
        },
        addAction: {
            reducer(state, action) {
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
            prepare(payload, editorId, actionName) {
                return { payload, meta: { editorId, actionName } };
            },
        },
        reorderItem: {
            reducer(state, action) {
                const editorId = action.meta.editorId;
                const editorState = state[editorId];
                const parentKey = action.payload;
                const editorStateStore = editorState.contentStore;
                reorderList(editorStateStore, parentKey, action.meta.oldIndex, action.meta.newIndex);
                return state;
            },
            prepare(payload, editorId, oldIndex, newIndex) {
                return { payload, meta: { editorId, oldIndex, newIndex } };
            },
        },
        deleteItem: {
            reducer(state, action) {
                const editorId = action.meta.editorId;
                const editorState = state[editorId];
                const selectedSubtree = getContentAndAncestors(editorState.contentStore, editorState.selection);
                const keyToDelete = action.payload;
                const selectedContent = selectedSubtree.find((content) => content.key === keyToDelete);
                if (selectedContent !== undefined) {
                    // If the content being deleted is also currently selected, we move the selection up to its parent node
                    editorState.selection = selectedContent.parentKey;
                }
                const contentStore = editorState.contentStore;
                deleteListItem(contentStore, keyToDelete);
                return state;
            },
            prepare(payload, editorId) {
                return { payload, meta: { editorId } };
            },
        },
    },
});
export const selectEditorSelection = (state, editorId) => {
    var _a, _b;
    return (_b = (_a = state[LOGICFORGE_REDUX_NAMESPACE]) === null || _a === void 0 ? void 0 : _a[editorId]) === null || _b === void 0 ? void 0 : _b.selection;
};
/**
 * Internal-only selector used for creating memoizable composite selectors
 * @param editorId
 */
const selectContentStore = (state, editorId) => {
    var _a, _b;
    return (_b = (_a = state[LOGICFORGE_REDUX_NAMESPACE]) === null || _a === void 0 ? void 0 : _a[editorId]) === null || _b === void 0 ? void 0 : _b.contentStore;
};
export const selectSelectedSubtree = createSelector([selectEditorSelection, selectContentStore], (selection, contentStore) => {
    if (selection !== undefined && contentStore !== undefined) {
        return getContentAndAncestors(contentStore, selection);
    }
});
export const selectIsKeySelected = (editorId, key) => (state) => {
    var _a;
    const editorState = (_a = state[LOGICFORGE_REDUX_NAMESPACE]) === null || _a === void 0 ? void 0 : _a[editorId];
    if (editorState !== undefined) {
        const contentStore = editorState.contentStore;
        const selectedContent = getContentAndAncestors(contentStore, editorState.selection);
        return selectedContent.find((content) => content.key == key) != undefined;
    }
    return false;
};
export const selectContentByKey = (editorId, key) => (state) => {
    var _a, _b;
    const editorStateStore = (_b = (_a = state[LOGICFORGE_REDUX_NAMESPACE]) === null || _a === void 0 ? void 0 : _a[editorId]) === null || _b === void 0 ? void 0 : _b.contentStore;
    if (editorStateStore !== undefined) {
        return editorStateStore.data[key];
    }
};
export const selectParameterSpecificationForKey = (editorId, key) => (state) => {
    var _a, _b, _c, _d;
    if (key !== undefined) {
        const editorStateStore = (_b = (_a = state[LOGICFORGE_REDUX_NAMESPACE]) === null || _a === void 0 ? void 0 : _a[editorId]) === null || _b === void 0 ? void 0 : _b.contentStore;
        const engineSpecification = (_d = (_c = state[LOGICFORGE_REDUX_NAMESPACE]) === null || _c === void 0 ? void 0 : _c[editorId]) === null || _d === void 0 ? void 0 : _d.engineSpec;
        if (editorStateStore !== undefined && engineSpecification !== undefined) {
            const state = editorStateStore.data[key];
            if (state.type === ContentType.VALUE ||
                state.type === ContentType.FUNCTION ||
                state.type === ContentType.INPUT_LIST) {
                return resolveParameterSpecForKey(editorStateStore, engineSpecification, key);
            }
        }
    }
};
function newFunctionConfigForSpec(functionName, spec) {
    const argumentConfigs = {};
    Object.entries(spec.parameters).forEach(([key, value]) => {
        argumentConfigs[key] = [{ type: ConfigType.VALUE, value: '' }];
    });
    return {
        type: ConfigType.FUNCTION,
        name: functionName,
        arguments: argumentConfigs,
    };
}
function newActionConfigForSpec(actionName, spec) {
    const inputArgumentConfigs = {};
    const actionArgumentConfigs = {};
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
export const { initEditor, setSelection, setFunction, setValue, addValue, reorderItem, deleteItem, } = editorsSlice.actions;
export default editorsSlice.reducer;
