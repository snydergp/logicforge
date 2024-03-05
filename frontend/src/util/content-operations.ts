import {
  ActionConfig,
  ActionContent,
  BlockContent,
  ConditionalConfig,
  ConditionalContent,
  ConditionalReferenceContent,
  ConfigType,
  Content,
  ContentStore,
  ContentType,
  ControlContent,
  ControlStatementConfig,
  ControlType,
  EngineSpec,
  FunctionConfig,
  FunctionContent,
  InputsContent,
  InputSpec,
  ListContent,
  LogicForgeConfig,
  ProcessContent,
  ReferenceConfig,
  ReferenceContent,
  ValueConfig,
  ValueContent,
  VariableConfig,
  VariableContent,
} from '../types';

export function loadRootContent(
  contentStore: ContentStore,
  config: LogicForgeConfig,
  engineSpec: EngineSpec,
) {
  if (contentStore.rootConfigKey !== undefined) {
    throw new Error('Supplied editor store already has a defined root');
  }
  if (config.type !== ConfigType.PROCESS && config.type !== ConfigType.FUNCTION) {
    throw new Error(`Illegal editor root type: ${config.type}`);
  }
  const rootState = constructContent(contentStore, config, engineSpec);
  contentStore.rootConfigKey = rootState.key;
}

function nextKey(contentStore: ContentStore) {
  return `${contentStore.count++}`;
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

export function addNewExecutable(
  contentStore: ContentStore,
  parentKey: string,
  newConfig: ActionConfig | ControlStatementConfig,
  engineSpec: EngineSpec,
) {
  const resolvedState = contentStore.data[parentKey];
  if (resolvedState.type !== ContentType.BLOCK) {
    throw new Error(
      `Attempted to add a new action on an illegal editor state: ${resolvedState.type}`,
    );
  }
  const blockContent = resolvedState as BlockContent;
  const newChildState = constructContent(contentStore, newConfig, engineSpec);
  newChildState.parentKey = blockContent.key;
  blockContent.childKeys.push(newChildState.key);
  return newChildState.key;
}

export function deleteAction(editorStore: ContentStore, key: string) {
  const resolvedState = editorStore.data[key];
  if (resolvedState.type !== ContentType.ACTION && resolvedState.type !== ContentType.PROCESS) {
    throw new Error(
      `Attempted to delete an action from an illegal editor state: ${resolvedState.type}`,
    );
  }
  const actionEditorState: ActionContent = resolvedState as ActionContent;
  const actionListEditorState = resolveParentState(editorStore, actionEditorState) as BlockContent;
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
    if (parentType !== ContentType.BLOCK && parentType !== ContentType.EXPRESSION_LIST) {
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
  if (resolvedState.type !== ContentType.EXPRESSION_LIST) {
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
  if (
    content.type !== ContentType.BLOCK &&
    content.type !== ContentType.EXPRESSION_LIST &&
    content.type !== ContentType.PROCESS
  ) {
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
  if (config.type === ConfigType.PROCESS) {
    const processKey = nextKey(contentStore);
    const processName = config.name;
    const rootBlockContent = constructContent(contentStore, config.rootBlock, engineSpec);
    rootBlockContent.parentKey = processKey;
    const returnExpressionContent =
      config.returnExpression !== undefined
        ? constructContent(contentStore, config.returnExpression, engineSpec)
        : undefined;
    if (returnExpressionContent !== undefined) {
      returnExpressionContent.parentKey = processKey;
    }
    const processContent: ProcessContent = {
      key: processKey,
      type: ContentType.PROCESS,
      name: processName,
      rootBlockKey: rootBlockContent.key,
      returnExpressionKey:
        returnExpressionContent !== undefined ? returnExpressionContent.key : undefined,
    };
    contentStore.data[processContent.key] = processContent;
    return processContent;
  } else if (config.type === ConfigType.BLOCK) {
    const blockKey = nextKey(contentStore);
    const blockChildKeys = config.executables.map((child) => {
      const childContent = constructContent(contentStore, child, engineSpec);
      childContent.parentKey = blockKey;
      return childContent.key;
    });
    return {
      key: blockKey,
      childKeys: blockChildKeys,
    } as BlockContent;
  } else if (config.type === ConfigType.CONTROL_STATEMENT) {
    const controlStatementKey = nextKey(contentStore);
    const type = config.controlType;
    if (type !== ControlType.CONDITIONAL) {
      throw new Error(`Unknown control statement type: ${type}`);
    }
    const conditionalConfig = config as ConditionalConfig;
    const controlStatementChildKeys = config.blocks.map((block) => {
      let content = constructContent(contentStore, block, engineSpec);
      content.parentKey = controlStatementKey;
      return content.key;
    });
    const conditionalExpression = constructContent(
      contentStore,
      conditionalConfig.conditionalExpression,
      engineSpec,
    );
    conditionalExpression.parentKey = controlStatementKey;
    return {
      key: controlStatementKey,
      childKeys: controlStatementChildKeys,
      controlType: ControlType.CONDITIONAL,
      conditionalExpressionKey: conditionalExpression.key,
    } as ConditionalContent;
  } else if (config.type === ConfigType.ACTION) {
    const actionKey = nextKey(contentStore);
    const actionName = config.name;
    const actionSpec = engineSpec.actions[actionName];

    const actionContent: ActionContent = {
      key: actionKey,
      type: ContentType.ACTION,
      name: actionName,
      spec: actionSpec,
      childKeys: {},
    };
    contentStore.data[actionContent.key] = actionContent;

    Object.entries(config.arguments).forEach(([name, argumentConfigs]) => {
      const childKey = nextKey(contentStore);
      const inputsState: InputsContent = {
        key: childKey,
        type: ContentType.EXPRESSION_LIST,
        name,
        spec: actionSpec.inputs[name],
        parentKey: actionKey,
        childKeys: [],
      };
      contentStore.data[childKey] = inputsState;
      actionContent.childKeys[name] = childKey;
      argumentConfigs.forEach((inputConfig) => {
        const content = constructContent(contentStore, inputConfig, engineSpec);
        content.parentKey = childKey;
        inputsState.childKeys.push(content.key);
      });
      actionContent.childKeys[name] = childKey;
    });

    const varContent =
      config.output !== undefined
        ? constructContent(contentStore, config.output, engineSpec)
        : undefined;
    if (varContent !== undefined) {
      varContent.parentKey = actionKey;
      actionContent.variableContentKey = varContent.key;
    }

    return actionContent;
  } else if (config.type === ConfigType.FUNCTION) {
    const functionKey = nextKey(contentStore);
    const functionName = config.name;
    const functionSpec = engineSpec.functions[functionName];
    const functionContent: FunctionContent = {
      key: functionKey,
      type: ContentType.FUNCTION,
      name: functionName,
      spec: functionSpec,
      childKeys: {},
    };
    contentStore.data[functionContent.key] = functionContent;
    Object.entries(config.arguments).forEach(([name, argumentConfigs]) => {
      const childKey = nextKey(contentStore);
      const inputsState: InputsContent = {
        key: childKey,
        type: ContentType.EXPRESSION_LIST,
        name,
        spec: functionSpec.inputs[name],
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
  } else if (config.type === ConfigType.VALUE) {
    const valueContent: ValueContent = {
      key: nextKey(contentStore),
      type: ContentType.VALUE,
      value: config.value,
    };
    contentStore.data[valueContent.key] = valueContent;
    return valueContent;
  } else if (config.type === ConfigType.CONDITIONAL_REFERENCE) {
    const referenceKey = nextKey(contentStore);
    const childKeys = config.references.map((coordinates) => {
      const refContent = getExecutableContentForCoordinates(contentStore, coordinates);
      return refContent.key;
    });
    const expressionContent = constructContent(contentStore, config.expression, engineSpec);
    const fallbackContent = constructContent(contentStore, config.fallback, engineSpec);
    return {
      key: referenceKey,
      childKeys: childKeys,
      expressionKey: expressionContent.key,
      fallbackKey: fallbackContent.key,
    } as ConditionalReferenceContent;
  } else if (config.type === ConfigType.REFERENCE) {
    const ref = config as ReferenceConfig;
    const pointedContent = findExecutableContent(contentStore, ref.coordinates);
    return {
      key: nextKey(contentStore),
      referenceKey: pointedContent.key,
      path: ref.path,
    } as ReferenceContent;
  } else if (config.type === ConfigType.VARIABLE) {
    const variableConfig = config as VariableConfig;
    return {
      key: nextKey(contentStore),
      type: ContentType.VARIABLE,
      title: variableConfig.title,
      description: variableConfig.description,
    } as VariableContent;
  } else {
    throw new Error(`Unknown config type`);
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

function findExecutableContent(
  contentStore: ContentStore,
  coordinates: number[],
): BlockContent | ControlContent | ActionContent {
  const process = contentStore.data[contentStore.rootConfigKey as string] as ProcessContent;
  let pointer: ListContent = contentStore.data[process.rootBlockKey] as BlockContent;
  for (let i = 0; i < coordinates.length; i++) {
    const coordinate = coordinates[i];
    const childKey = pointer.childKeys[coordinate];
    pointer = contentStore.data[childKey] as ListContent;
  }
  return pointer as BlockContent | ControlContent | ActionContent;
}

function getCoordinatesForKey(contentStore: ContentStore, key: string): number[] {
  const reverseCoordinates: number[] = [];
  let keyPointer = key;
  let contentPointer = contentStore.data[key];
  if (contentPointer === undefined) {
    throw new Error(`Missing content: ${key}`);
  }
  while (contentPointer.parentKey !== undefined) {
    const parentContent = contentStore.data[contentPointer.parentKey];
    if (parentContent === undefined) {
      throw new Error(`Missing parent content: ${contentPointer.parentKey}`);
    } else if (
      parentContent.type !== ContentType.BLOCK &&
      parentContent.type !== ContentType.CONTROL
    ) {
      throw new Error(`Unexpected parent type: ${parentContent.type}`);
    } else {
      const listContent = parentContent as ListContent;
      const index = listContent.childKeys.indexOf(keyPointer);
      if (index < 0) {
        throw new Error(
          `Invalid content structure: parent ${listContent.key} does not contain child ${keyPointer}`,
        );
      }
      reverseCoordinates.push(index);
      keyPointer = parentContent.key;
      contentPointer = parentContent;
    }
  }
  return reverseCoordinates.reverse();
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
    ? engineSpec.functions[parentName].inputs[parameterName]
    : (engineSpec.actions[parentName].inputs[parameterName] as InputSpec);
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
  while (pointer.parentKey !== undefined && pointer.type !== ContentType.EXPRESSION_LIST) {
    pointer = contentStore.data[pointer.parentKey];
  }
  if (pointer.type !== ContentType.EXPRESSION_LIST) {
    throw new Error('Unexpected state structure encountered');
  }
  const parameterName = (pointer as InputsContent).name;
  const parentFunctionOrAction = contentStore.data[pointer.parentKey as string];
  const parentName = (parentFunctionOrAction as FunctionContent | ActionContent).name;
  return parentFunctionOrAction.type === ContentType.FUNCTION
    ? engineSpec.functions[parentName].inputs[parameterName]
    : (engineSpec.actions[parentName].inputs[parameterName] as InputSpec);
}

export function getCoordinatesForExecutableKey(contentStore: ContentStore, contentKey: string) {
  const coordinates: number[] = [];
  const content = contentStore.data[contentKey];
  if (
    content !== undefined &&
    (content.type === ContentType.BLOCK ||
      content.type === ContentType.CONTROL ||
      content.type === ContentType.ACTION)
  ) {
    let key = contentKey;
    const visitContent = (content: Content) => {
      let coordinate = (content as ListContent).childKeys.indexOf(key);
      key = content.key;
      coordinates.push(coordinate);
    };
    recurseUp(contentStore, visitContent, contentKey);
    return coordinates.reverse();
  }
}

export function getExecutableContentForCoordinates(
  contentStore: ContentStore,
  coordinates: number[],
) {
  let contentPointer = contentStore.data[contentStore.rootConfigKey as string];
  for (let coordinate of coordinates) {
    if (
      contentPointer === undefined ||
      (contentPointer.type !== ContentType.BLOCK &&
        contentPointer.type !== ContentType.CONTROL &&
        contentPointer.type !== ContentType.ACTION)
    ) {
      throw new Error('Illegal reference coordinates');
    }
    const listContent = contentPointer as ListContent;
    if (coordinate >= listContent.childKeys.length) {
      throw new Error('Illegal reference coordinates');
    }
    const childKey = listContent.childKeys[coordinate];
    contentPointer = contentStore.data[childKey];
  }
  return contentPointer;
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
    case ContentType.FUNCTION:
      const functionContent = content as FunctionContent;
      Object.entries(functionContent.childKeys).forEach(([name, childKey]) => {
        recurseDown(contentStore, func, childKey, descendantsFirst);
      });
      break;
    case ContentType.ACTION:
      const actionContent = content as ActionContent;
      Object.entries(actionContent.childKeys).forEach(([name, childKey]) => {
        recurseDown(contentStore, func, childKey, descendantsFirst);
      });
      break;
    case ContentType.PROCESS:
    case ContentType.BLOCK:
    case ContentType.EXPRESSION_LIST:
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
