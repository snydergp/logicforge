import { StoreStructure } from '../types';
import { ContentStore, EngineSpec, LogicForgeConfig, ProcessConfig } from '../../types';
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
export declare const selectEditorSelection: (state: StoreStructure, editorId: string) => string | undefined;
export declare const selectSelectedSubtree: ((state: Partial<import("../types").FullStoreShape>, editorId: string) => import("../../types").Content[] | undefined) & import("reselect").OutputSelectorFields<(args_0: string | undefined, args_1: ContentStore | undefined) => import("../../types").Content[] | undefined, {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const selectIsKeySelected: (editorId: string, key: string) => (state: StoreStructure) => boolean;
export declare const selectContentByKey: (editorId: string, key: string) => (state: StoreStructure) => import("../../types").Content | undefined;
export declare const selectParameterSpecificationForKey: (editorId: string, key?: string) => (state: StoreStructure) => import("../../types").ParameterSpec | undefined;
export declare const initEditor: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: ProcessConfig, engineSpecification: EngineSpec, editorId?: string | undefined], ProcessConfig, "LOGICFORGE/initEditor", never, {
    engineSpecification: EngineSpec;
    editorId: string | undefined;
}>, setSelection: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: string, editorId: string], string, "LOGICFORGE/setSelection", never, {
    editorId: string;
}>, setFunction: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: string, editorId: string, key: string], string, "LOGICFORGE/setFunction", never, {
    editorId: string;
    key: string;
}>, setValue: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: string, editorId: string, key: string], string, "LOGICFORGE/setValue", never, {
    editorId: string;
    key: string;
}>, addValue: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: string, editorId: string], string, "LOGICFORGE/addValue", never, {
    editorId: string;
}>, addAction: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: string, editorId: string, actionName: string], string, "LOGICFORGE/addAction", never, {
    editorId: string;
    actionName: string;
}>, reorderItem: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: string, editorId: string, oldIndex: number, newIndex: number], string, "LOGICFORGE/reorderItem", never, {
    editorId: string;
    oldIndex: number;
    newIndex: number;
}>, deleteItem: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: string, editorId: string], string, "LOGICFORGE/deleteItem", never, {
    editorId: string;
}>;
declare const _default: import("redux").Reducer<EditorsState, import("redux").AnyAction>;
export default _default;
