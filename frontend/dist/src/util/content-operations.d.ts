import { ActionConfig, Content, ContentStore, EngineSpec, FunctionConfig, FunctionContent, InputsContent, LogicForgeConfig, ParameterSpec, ValueConfig, ValueContent } from '../types';
export declare function loadRootContent(editorStateStore: ContentStore, config: LogicForgeConfig, engineSpec: EngineSpec): void;
/**
 * This function removes all descendants of a deleted parent node from the store to avoid memory leaks. This function
 * does not remove this state as a child reference from any parent node -- this should be done by the caller. Also note
 * that this function only deletes the descendant states from the store, it does not remove their links to each other.
 * @param editorStateStore the store from which the state should be deleted
 * @param stateKeyToDelete the key for the state to be recursively deleted from the store
 */
export declare function recursiveDelete(editorStateStore: ContentStore, stateKeyToDelete: string): void;
export declare function replaceInput(editorStateStore: ContentStore, key: string, newConfig: FunctionConfig | ValueConfig, engineSpec: EngineSpec): Content;
export declare function addAction(editorStateStore: ContentStore, parentKey: string, newConfig: ActionConfig, engineSpec: EngineSpec): void;
export declare function deleteAction(editorStore: ContentStore, key: string): void;
export declare function deleteListItem(contentStore: ContentStore, key: string): void;
export declare function addInput(editorStateStore: ContentStore, engineSpec: EngineSpec, parentKey: string, newConfig: FunctionConfig | ValueConfig): void;
export declare function deleteInput(editorStateStore: ContentStore, engineSpec: EngineSpec, key: string): void;
export declare function reorderList(contentStore: ContentStore, parentKey: string, oldIndex: number, newIndex: number): void;
export declare function constructContent(contentStore: ContentStore, config: LogicForgeConfig, engineSpec: EngineSpec): Content;
export declare function getContentAndAncestors(contentStore: ContentStore, key: string): Content[];
export declare function getAncestorAtDepth(contentStore: ContentStore, key: string, depth: number): Content;
export declare function getKeyDepth(contentStore: ContentStore, key: string): number;
export declare function getStatePath(contentStore: ContentStore, key: string): string[];
export declare function resolveParameterSpecForKey(contentStore: ContentStore, engineSpec: EngineSpec, key: string): ParameterSpec;
export declare function resolveParameterSpec(contentStore: ContentStore, engineSpec: EngineSpec, editorState: InputsContent | FunctionContent | ValueContent): ParameterSpec;
