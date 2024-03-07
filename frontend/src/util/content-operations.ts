import {
  ActionConfig,
  ActionContent,
  BlockConfig,
  BlockContent,
  ConditionalConfig,
  ConditionalContent,
  ConditionalReferenceConfig,
  ConditionalReferenceContent,
  ConfigType,
  Content,
  ContentStore,
  ContentType,
  ControlConfig,
  ControlContent,
  ControlType,
  EngineSpec,
  ExpressionContent,
  FunctionConfig,
  FunctionContent,
  InputsContent,
  InputSpec,
  ListContent,
  LogicForgeConfig,
  ProcessConfig,
  ProcessContent,
  ReferenceConfig,
  ReferenceContent,
  ValueConfig,
  ValueContent,
  VariableConfig,
  VariableContent,
} from '../types';
import { MetadataProperties } from '../constant/metadata-properties';
import { WellKnownType } from '../constant/well-known-type';

function nextKey(contentStore: ContentStore) {
  return `${contentStore.count++}`;
}

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

export function constructContent(
  contentStore: ContentStore,
  config: LogicForgeConfig,
  engineSpec: EngineSpec,
): Content {
  switch (config.type) {
    case ConfigType.BLOCK:
      return constructBlock(config as BlockConfig, contentStore, engineSpec);
    case ConfigType.PROCESS:
      return constructProcess(config as ProcessConfig, contentStore, engineSpec);
    case ConfigType.ACTION:
      return constructAction(config as ActionConfig, contentStore, engineSpec);
    case ConfigType.CONTROL_STATEMENT:
      return constructControl(config as ControlConfig, contentStore, engineSpec);
    case ConfigType.VALUE:
      return constructValue(config as ValueConfig, contentStore, engineSpec);
    case ConfigType.FUNCTION:
      return constructFunction(config as FunctionConfig, contentStore, engineSpec);
    case ConfigType.CONDITIONAL_REFERENCE:
      return constructConditionalReference(
        config as ConditionalReferenceConfig,
        contentStore,
        engineSpec,
      );
    case ConfigType.REFERENCE:
      return constructReference(config as ReferenceConfig, contentStore, engineSpec);
    case ConfigType.VARIABLE:
      return constructVariable(config as VariableConfig, contentStore, engineSpec);
  }
}

function constructProcess(
  config: ProcessConfig,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
) {
  const processKey = nextKey(contentStore);
  const processName = config.name;
  const processSpec = engineSpec.processes[processName];
  const rootBlockContent = constructContent(contentStore, config.rootBlock, engineSpec);
  rootBlockContent.parentKey = processKey;
  const returnExpressionContent =
    config.returnExpression !== undefined
      ? constructContent(contentStore, config.returnExpression, engineSpec)
      : undefined;
  if (returnExpressionContent !== undefined) {
    returnExpressionContent.parentKey = processKey;
  }
  const inputVariableKeys = Object.entries(processSpec.inputs).map(([name, variableSpec]) => {
    const variableConfig = {
      type: ConfigType.VARIABLE,
      title: variableSpec.title,
      description: variableSpec.description,
    } as VariableConfig;
    const variableContent = constructVariable(variableConfig, contentStore, engineSpec);
    variableContent.parentKey = processKey;
    variableContent.basePath = name;
    variableContent.optional = variableSpec.optional;
    variableContent.typeId = variableSpec.typeId;
    return variableContent.key;
  });
  const processContent: ProcessContent = {
    key: processKey,
    type: ContentType.PROCESS,
    name: processName,
    spec: processSpec,
    rootBlockKey: rootBlockContent.key,
    outputTypeId: processSpec.outputTypeId,
    returnExpressionKey:
      returnExpressionContent !== undefined ? returnExpressionContent.key : undefined,
    inputVariableKeys,
  };
  contentStore.data[processContent.key] = processContent;
  return processContent;
}

function constructBlock(config: BlockConfig, contentStore: ContentStore, engineSpec: EngineSpec) {
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
}

function constructControl(
  config: ControlConfig,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
) {
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
}

function constructAction(config: ActionConfig, contentStore: ContentStore, engineSpec: EngineSpec) {
  const key = nextKey(contentStore);
  const name = config.name;
  const spec = engineSpec.actions[name];

  // for actions with dynamic return types, override the output type with the output type of the
  //  input defined in the metadata
  const outputTypeInputName = spec.metadata[MetadataProperties.DYNAMIC_RETURN_TYPE];
  let outputTypeId = spec.outputTypeId;

  const actionChildKeys: { [key: string]: string } = {};
  Object.entries(config.arguments).forEach(([argName, argumentConfigs]) => {
    const childKey = nextKey(contentStore);
    const inputsContent: InputsContent = {
      key: childKey,
      type: ContentType.EXPRESSION_LIST,
      name: argName,
      spec: spec.inputs[argName],
      parentKey: key,
      childKeys: [],
    };
    contentStore.data[childKey] = inputsContent;
    actionChildKeys[argName] = childKey;
    argumentConfigs.forEach((inputConfig, index) => {
      const content = constructContent(contentStore, inputConfig, engineSpec);
      if (index === 0 && argName === outputTypeInputName) {
        const expressionContent = content as ExpressionContent;
        if (expressionContent.outputTypeId !== null) {
          outputTypeId = expressionContent.outputTypeId;
        }
      }
      content.parentKey = childKey;
      inputsContent.childKeys.push(content.key);
    });
  });

  const actionContent: ActionContent = {
    type: ContentType.ACTION,
    key,
    name,
    spec,
    outputTypeId,
    childKeys: actionChildKeys,
  };
  contentStore.data[actionContent.key] = actionContent;

  const varContent =
    config.output !== undefined
      ? constructVariable(config.output, contentStore, engineSpec)
      : undefined;
  if (varContent !== undefined) {
    varContent.parentKey = key;
    varContent.typeId = inferActionOutputType(actionContent, contentStore, engineSpec) as string;
    actionContent.variableContentKey = varContent.key;
  }

  return actionContent;
}

function constructFunction(
  config: FunctionConfig,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
) {
  const key = nextKey(contentStore);
  const name = config.name;
  const spec = engineSpec.functions[name];

  // for actions with dynamic return types, override the output type with the output type of the
  //  input defined in the metadata
  const outputTypeInputName = spec.metadata[MetadataProperties.DYNAMIC_RETURN_TYPE];
  let outputTypeId = spec.outputTypeId;

  const functionChildKeys: { [key: string]: string } = {};
  Object.entries(config.arguments).forEach(([argName, argumentConfigs]) => {
    const childKey = nextKey(contentStore);
    const inputsContent: InputsContent = {
      key: childKey,
      type: ContentType.EXPRESSION_LIST,
      name: argName,
      spec: spec.inputs[argName],
      parentKey: key,
      childKeys: [],
    };
    contentStore.data[childKey] = inputsContent;
    functionChildKeys[argName] = childKey;
    argumentConfigs.forEach((inputConfig, index) => {
      const content = constructContent(contentStore, inputConfig, engineSpec);
      if (index === 0 && argName === outputTypeInputName) {
        const expressionContent = content as ExpressionContent;
        if (expressionContent.outputTypeId !== null) {
          outputTypeId = expressionContent.outputTypeId;
        }
      }
      content.parentKey = childKey;
      inputsContent.childKeys.push(content.key);
    });
  });

  const functionContent: FunctionContent = {
    type: ContentType.FUNCTION,
    key,
    name,
    spec,
    outputTypeId,
    childKeys: functionChildKeys,
  };
  contentStore.data[functionContent.key] = functionContent;

  return functionContent;
}

function constructValue(config: ValueConfig, contentStore: ContentStore, engineSpec: EngineSpec) {
  const valueContent: ValueContent = {
    key: nextKey(contentStore),
    type: ContentType.VALUE,
    value: config.value,
    errors: [],
    outputTypeId: null, // parent will override this following construction
  };
  contentStore.data[valueContent.key] = valueContent;
  return valueContent;
}

function constructConditionalReference(
  config: ConditionalReferenceConfig,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
) {
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
}

function constructReference(
  config: ReferenceConfig,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
) {
  const ref = config as ReferenceConfig;
  const pointedContent = findExecutableContent(contentStore, ref.coordinates);
  return {
    key: nextKey(contentStore),
    referenceKey: pointedContent.key,
    path: ref.path,
  } as ReferenceContent;
}

function constructVariable(
  config: VariableConfig,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
) {
  const variableConfig = config as VariableConfig;
  return {
    key: nextKey(contentStore),
    type: ContentType.VARIABLE,
    title: variableConfig.title,
    description: variableConfig.description,
  } as VariableContent;
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
  newConfig: ActionConfig | ControlConfig,
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

export function getContentPath(contentStore: ContentStore, key: string) {
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
  const processKey = contentStore.rootConfigKey as string;
  const process = contentStore.data[processKey] as ProcessContent;
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

function inferExpressionOutputType(
  content: ExpressionContent,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
): string | null {
  switch (content.type) {
    case ContentType.FUNCTION:
      return inferFunctionOutputType(content as FunctionContent, contentStore, engineSpec);
    case ContentType.REFERENCE:
      return inferReferenceOutputType(content as ReferenceContent, contentStore, engineSpec);
    case ContentType.VALUE:
      return inferValueOutputType(content as ValueContent, contentStore, engineSpec);
    default:
      throw new Error(`Invalid child expression type: ${content.type}`);
  }
}

function inferActionOutputType(
  content: ActionContent,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
) {
  const spec = content.spec;
  const dynamicReturnTypeProperty = spec.metadata[MetadataProperties.DYNAMIC_RETURN_TYPE];
  if (dynamicReturnTypeProperty === undefined) {
    return spec.outputTypeId;
  }
  const inputContent = contentStore.data[content.childKeys[dynamicReturnTypeProperty]];
  return inferExpressionOutputType(inputContent as ExpressionContent, contentStore, engineSpec);
}

function inferFunctionOutputType(
  content: FunctionContent,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
) {
  const spec = content.spec;
  const dynamicReturnTypeProperty = spec.metadata[MetadataProperties.DYNAMIC_RETURN_TYPE];
  if (dynamicReturnTypeProperty === undefined) {
    return spec.outputTypeId;
  }
  const inputsContent = contentStore.data[
    content.childKeys[dynamicReturnTypeProperty]
  ] as InputsContent;
  if (inputsContent.childKeys.length > 0) {
    // FUTURE instead of accepting the first value for multi-value types, find the supertype of all
    //  children (or error if no overlap)
    const firstExpressionContent = contentStore.data[inputsContent.childKeys[0]];
    inferExpressionOutputType(
      firstExpressionContent as ExpressionContent,
      contentStore,
      engineSpec,
    );
  }
}

function inferReferenceOutputType(
  content: ReferenceContent,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
) {
  let referencedContent = contentStore.data[content.referenceKey] as VariableContent;
  return referencedContent.typeId;
}

function inferValueOutputType(
  content: ValueContent,
  contentStore: ContentStore,
  engineSpec: EngineSpec,
) {
  // TODO might need to revisit this. should all unrestricted value inputs be interpreted as strings?
  return WellKnownType.STRING as string;
}
