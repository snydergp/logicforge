import {
  ActionConfig,
  ActionContent,
  ActionListContent,
  ConfigType,
  Content,
  ContentStore,
  ContentType,
  EngineSpec,
  FunctionConfig,
  FunctionContent,
  InputConfig,
  InputsContent,
  ListContent,
  LogicForgeConfig,
  NodeContent,
  ParameterSpec,
  ProcessContent,
  SpecType,
  ValueConfig,
  ValueContent,
} from '../types';

export function loadRootContent(
  editorStateStore: ContentStore,
  config: LogicForgeConfig,
  engineSpec: EngineSpec,
) {
  if (editorStateStore.rootConfigKey !== undefined) {
    throw new Error('Supplied editor store already has a defined root');
  }
  if (config.type !== ConfigType.PROCESS && config.type !== ConfigType.FUNCTION) {
    throw new Error(`Illegal editor root type: ${config.type}`);
  }
  const rootState = constructContent(editorStateStore, config, engineSpec);
  editorStateStore.rootConfigKey = rootState.key;
}

function nextKey(editorStore: ContentStore) {
  return `${editorStore.editorId}-${editorStore.count++}`;
}

/**
 * This function removes all descendants of a deleted parent node from the store to avoid memory leaks. This function
 * does not remove this state as a child reference from any parent node -- this should be done by the caller. Also note
 * that this function only deletes the descendant states from the store, it does not remove their links to each other.
 * @param editorStateStore the store from which the state should be deleted
 * @param stateKeyToDelete the key for the state to be recursively deleted from the store
 */
export function recursiveDelete(editorStateStore: ContentStore, stateKeyToDelete: string) {
  recurseDown(
    editorStateStore,
    (state) => {
      if (editorStateStore.data.hasOwnProperty(state.key)) {
        delete editorStateStore.data[state.key];
      }
    },
    stateKeyToDelete,
    true,
  );
}

export function replaceInput(
  editorStateStore: ContentStore,
  key: string,
  newConfig: FunctionConfig | ValueConfig,
  engineSpec: EngineSpec,
) {
  const resolvedState = editorStateStore.data[key];
  if (resolvedState.type !== ContentType.FUNCTION && resolvedState.type !== ContentType.VALUE) {
    throw new Error(`Attempted to set an input on an illegal editor state: ${resolvedState.type}`);
  }
  const parentInputContent = editorStateStore.data[
    resolvedState.parentKey as string
  ] as InputsContent;
  const previousChildKey = resolvedState.key;
  const previousIndex = parentInputContent.childKeys.indexOf(previousChildKey);
  const newChildContent = constructContent(editorStateStore, newConfig, engineSpec);
  newChildContent.parentKey = parentInputContent.key;
  parentInputContent.childKeys[previousIndex] = newChildContent.key;
  recursiveDelete(editorStateStore, previousChildKey);
  return newChildContent;
}

export function addAction(
  editorStateStore: ContentStore,
  parentKey: string,
  newConfig: ActionConfig,
  engineSpec: EngineSpec,
) {
  const resolvedState = editorStateStore.data[parentKey];
  if (resolvedState.type !== ContentType.ACTION_LIST) {
    throw new Error(
      `Attempted to add a new action on an illegal editor state: ${resolvedState.type}`,
    );
  }
  const parentActionsState = resolvedState as ActionListContent;
  const newChildState = constructContent(editorStateStore, newConfig, engineSpec);
  newChildState.parentKey = parentActionsState.key;
  parentActionsState.childKeys.push(newChildState.key);
}

export function deleteAction(editorStore: ContentStore, key: string) {
  const resolvedState = editorStore.data[key];
  if (resolvedState.type !== ContentType.ACTION) {
    throw new Error(
      `Attempted to delete an action from an illegal editor state: ${resolvedState.type}`,
    );
  }
  const actionEditorState: ActionContent = resolvedState as ActionContent;
  const actionListEditorState = resolveParentState(
    editorStore,
    actionEditorState,
  ) as ActionListContent;
  const indexToDelete = actionListEditorState.childKeys.indexOf(key);
  actionListEditorState.childKeys = actionListEditorState.childKeys.splice(indexToDelete, 1);
  recursiveDelete(editorStore, actionEditorState.key);
}

export function deleteListItem(contentStore: ContentStore, key: string) {
  const content = contentStore.data[key];
  if (content !== undefined) {
    const parentKey = content.parentKey as string;
    const parent = contentStore.data[parentKey];
    const parentType = parent.type;
    if (parentType !== ContentType.ACTION_LIST && parentType !== ContentType.INPUT_LIST) {
      throw new Error(
        `Attempted to delete a list item from an illegal parent content type: ${parentType}`,
      );
    }
    const listContent = parent as ListContent;
    const currentIndex = listContent.childKeys.indexOf(key);
    listContent.childKeys.splice(currentIndex, 1);
    recursiveDelete(contentStore, key);
  }
}

export function addInput(
  editorStateStore: ContentStore,
  engineSpec: EngineSpec,
  parentKey: string,
  newConfig: FunctionConfig | ValueConfig,
) {
  const resolvedState = editorStateStore.data[parentKey];
  if (resolvedState.type !== ContentType.INPUT_LIST) {
    throw new Error(
      `Attempted to add a new input on an illegal editor state: ${resolvedState.type}`,
    );
  }
  const inputsEditor: InputsContent = resolvedState as InputsContent;
  const parameterSpec = resolveParameterSpecForInput(editorStateStore, engineSpec, inputsEditor);
  if (!parameterSpec.multi) {
    throw new Error(`Attempted to add an additional value to a non-multi parameter`);
  }
  const newChildState = constructContent(editorStateStore, newConfig, engineSpec);
  newChildState.parentKey = inputsEditor.key;
  inputsEditor.childKeys.push(newChildState.key);
}

export function deleteInput(editorStateStore: ContentStore, engineSpec: EngineSpec, key: string) {
  const resolvedState = editorStateStore.data[key];
  if (resolvedState.type !== ContentType.FUNCTION && resolvedState.type !== ContentType.VALUE) {
    throw new Error(
      `Attempted to remove an input from an illegal editor state: ${resolvedState.type}`,
    );
  }
  const inputsEditor = resolveParentState(editorStateStore, resolvedState) as InputsContent;
  const parameterSpec = resolveParameterSpecForInput(editorStateStore, engineSpec, inputsEditor);
  if (!parameterSpec.multi) {
    throw new Error(`Attempted to remove a value from a non-multi parameter`);
  }
  const indexToDelete = inputsEditor.childKeys.indexOf(key);
  inputsEditor.childKeys = inputsEditor.childKeys.splice(indexToDelete, 1);
  recursiveDelete(editorStateStore, resolvedState.key);
}

export function reorderList(
  contentStore: ContentStore,
  parentKey: string,
  oldIndex: number,
  newIndex: number,
) {
  const content = contentStore.data[parentKey];
  if (content.type !== ContentType.ACTION_LIST && content.type !== ContentType.INPUT_LIST) {
    throw new Error(`Attempted to execute reorder operation on not-list state: ${content.type}`);
  }
  const listContent = content as ListContent;
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

export function constructContent(
  contentStore: ContentStore,
  config: LogicForgeConfig,
  engineSpec: EngineSpec,
): Content {
  switch (config.type) {
    case ConfigType.PROCESS:
      const processKey = nextKey(contentStore);
      const processName = config.name;
      const processContent: ProcessContent = {
        key: processKey,
        type: ContentType.PROCESS,
        name: processName,
        childKeys: [],
      };
      contentStore.data[processContent.key] = processContent;
      config.actions
        .map((actionConfig) => constructContent(contentStore, actionConfig, engineSpec))
        .forEach((actionContent) => {
          actionContent.parentKey = processKey;
          processContent.childKeys.push(actionContent.key);
        });
      return processContent;
    case ConfigType.ACTION:
      const actionKey = nextKey(contentStore);
      const actionName = config.name;
      const actionContent: ActionContent = {
        key: actionKey,
        type: ContentType.ACTION,
        name: actionName,
        actionChildKeys: {},
        inputChildKeys: {},
      };
      contentStore.data[actionContent.key] = actionContent;
      const actionSpec = engineSpec.actions[actionName];
      Object.entries(config.actionArguments).forEach(([name, configs]) => {
        const parameterSpec = actionSpec.actionParameters[name];
        let listContent: ListContent;
        const childKey = nextKey(contentStore);
        listContent = {
          key: childKey,
          type: ContentType.ACTION_LIST,
          name,
          parentKey: actionKey,
          childKeys: [],
        } as ActionListContent;
        contentStore.data[childKey] = listContent;
        actionContent.actionChildKeys[name] = childKey;
        configs.forEach((config) => {
          const content = constructContent(contentStore, config, engineSpec);
          content.parentKey = listContent.key;
          listContent.childKeys.push(content.key);
        });
      });
      Object.entries(config.inputArguments).forEach(([name, configs]) => {
        const parameterSpec = actionSpec.inputParameters[name];
        let listContent: ListContent;
        const childKey = nextKey(contentStore);
        listContent = {
          key: childKey,
          type: ContentType.INPUT_LIST,
          name,
          parentKey: actionKey,
          childKeys: [],
        } as InputsContent;
        contentStore.data[childKey] = listContent;
        actionContent.inputChildKeys[name] = childKey;
        configs.forEach((config) => {
          const content = constructContent(contentStore, config, engineSpec);
          content.parentKey = listContent.key;
          listContent.childKeys.push(content.key);
        });
      });
      return actionContent;
    case ConfigType.FUNCTION:
      const functionKey = nextKey(contentStore);
      const functionName = config.name;
      const functionContent: FunctionContent = {
        key: functionKey,
        type: ContentType.FUNCTION,
        name: functionName,
        childKeys: {},
      };
      contentStore.data[functionContent.key] = functionContent;
      Object.entries(config.arguments).forEach(([name, argumentConfigs]) => {
        const childKey = nextKey(contentStore);
        const inputsState: InputsContent = {
          key: childKey,
          type: ContentType.INPUT_LIST,
          name,
          parentKey: functionKey,
          childKeys: [],
        };
        contentStore.data[childKey] = inputsState;
        functionContent.childKeys[name] = childKey;
        argumentConfigs.forEach((inputConfig) => {
          const content = constructContent(contentStore, inputConfig, engineSpec);
          content.parentKey = childKey;
          inputsState.childKeys.push(content.key);
        });
      });
      return functionContent;
    case ConfigType.VALUE:
      const valueState: ValueContent = {
        key: nextKey(contentStore),
        type: ContentType.VALUE,
        value: config.value,
      };
      contentStore.data[valueState.key] = valueState;
      return valueState;
  }
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

export function getAncestorAtDepth(contentStore: ContentStore, key: string, depth: number) {
  const ancestorPath: Content[] = [];
  recurseUp(
    contentStore,
    (content: Content) => {
      ancestorPath.push(content);
    },
    key,
    true,
  );
  return ancestorPath[depth];
}

export function getKeyDepth(contentStore: ContentStore, key: string) {
  let depth = -1;
  recurseUp(
    contentStore,
    () => {
      depth++;
    },
    key,
  );
  return depth;
}

export function getStatePath(contentStore: ContentStore, key: string) {
  const ancestorPath: string[] = [];
  recurseUp(
    contentStore,
    (content: Content) => {
      ancestorPath.push(content.key);
    },
    key,
    true,
  );
  return ancestorPath;
}

function configFromState<T extends LogicForgeConfig | LogicForgeConfig[]>(
  contentStore: ContentStore,
  key?: string,
): T {
  const content = contentStore.data[key || (contentStore.rootConfigKey as string)];
  switch (content.type) {
    case ContentType.PROCESS:
      const processContent = content as ProcessContent;
      const processArgs: ActionConfig[] = [];
      processContent.childKeys.forEach((childKey) => {
        processArgs.push(configFromState<ActionConfig>(contentStore, childKey));
      });
      return {
        type: ConfigType.PROCESS,
        name: processContent.name,
        actions: processArgs,
      } as T;
    case ContentType.ACTION_LIST:
      const actionListContent = content as ActionListContent;
      return actionListContent.childKeys.map((childKey) => {
        return configFromState<ActionConfig>(contentStore, childKey);
      }) as T;
    case ContentType.ACTION:
      const actionContent = content as ActionContent;
      const actionChildArgs: { [key: string]: ActionConfig[] } = {};
      const actionInputArgs: { [key: string]: InputConfig[] } = {};
      Object.entries(actionContent.actionChildKeys).forEach(([name, childKey]) => {
        actionChildArgs[name] = configFromState<ActionConfig[]>(contentStore, childKey);
      });
      Object.entries(actionContent.inputChildKeys).forEach(([name, childKey]) => {
        actionInputArgs[name] = configFromState<InputConfig[]>(contentStore, childKey);
      });
      return {
        type: ConfigType.ACTION,
        name: actionContent.name,
        actionArguments: actionChildArgs,
        inputArguments: actionInputArgs,
      } as T;
    case ContentType.FUNCTION:
      const functionContent = content as FunctionContent;
      const functionArgs: { [key: string]: InputConfig[] } = {};
      Object.entries(functionContent.childKeys).forEach(([name, childKey]) => {
        functionArgs[name] = configFromState<InputConfig[]>(contentStore, childKey);
      });
      return {
        type: ConfigType.FUNCTION,
        name: functionContent.name,
        arguments: functionArgs,
      } as T;
    case ContentType.INPUT_LIST:
      const inputsContent = content as InputsContent;
      return inputsContent.childKeys.map((childKey) => {
        return configFromState<InputConfig>(contentStore, childKey);
      }) as T;
    case ContentType.VALUE:
      const valueContent = content as ValueContent;
      return {
        type: ConfigType.VALUE,
        value: valueContent.value,
      } as T;
  }
}

function resolveParentState(contentStore: ContentStore, content: Content) {
  if (content.parentKey !== undefined) {
    return contentStore.data[content.parentKey];
  }
}

function resolveParameterSpecForInput(
  contentStore: ContentStore,
  engineSpec: EngineSpec,
  inputsContent: InputsContent,
) {
  const parameterName = inputsContent.name;
  const parentFunctionOrAction = contentStore.data[inputsContent.parentKey as string];
  const parentName = (parentFunctionOrAction as FunctionContent | ActionContent).name;
  return parentFunctionOrAction.type === ContentType.FUNCTION
    ? engineSpec.functions[parentName].parameters[parameterName]
    : (engineSpec.actions[parentName].inputParameters[parameterName] as ParameterSpec);
}

export function resolveParameterSpecForKey(
  contentStore: ContentStore,
  engineSpec: EngineSpec,
  key: string,
) {
  return resolveParameterSpec(
    contentStore,
    engineSpec,
    contentStore.data[key] as InputsContent | FunctionContent | ValueContent,
  );
}

export function resolveParameterSpec(
  contentStore: ContentStore,
  engineSpec: EngineSpec,
  editorState: InputsContent | FunctionContent | ValueContent,
) {
  let pointer: Content = editorState;
  while (pointer.parentKey !== undefined && pointer.type !== ContentType.INPUT_LIST) {
    pointer = contentStore.data[pointer.parentKey];
  }
  if (pointer.type !== ContentType.INPUT_LIST) {
    throw new Error('Unexpected state structure encountered');
  }
  const parameterName = (pointer as InputsContent).name;
  const parentFunctionOrAction = contentStore.data[pointer.parentKey as string];
  const parentName = (parentFunctionOrAction as FunctionContent | ActionContent).name;
  return parentFunctionOrAction.type === ContentType.FUNCTION
    ? engineSpec.functions[parentName].parameters[parameterName]
    : (engineSpec.actions[parentName].inputParameters[parameterName] as ParameterSpec);
}

/**
 * Utility method for traversing up the editor state tree
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
  const content = contentStore.data[initialKey];
  if (content === undefined) {
    return;
  }

  if (!ancestorsFirst) {
    func(content);
  }

  if (content !== undefined && content.parentKey !== undefined) {
    recurseUp(contentStore, func, content.parentKey, ancestorsFirst);
  }

  if (ancestorsFirst) {
    func(content);
  }
}

/**
 * Utility method for traversing down the editor state tree
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
  const content = contentStore.data[initialKey || (contentStore.rootConfigKey as string)];
  if (content === undefined) {
    return;
  }

  if (!descendantsFirst) {
    func(content);
  }

  switch (content.type) {
    case ContentType.PROCESS:
    case ContentType.ACTION:
    case ContentType.FUNCTION:
      const nodeContent = content as NodeContent;
      Object.entries(nodeContent.childKeys).forEach(([name, childKey]) => {
        recurseDown(contentStore, func, childKey, descendantsFirst);
      });
      break;
    case ContentType.ACTION_LIST:
    case ContentType.INPUT_LIST:
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
