import { useSelector } from 'react-redux';
import { selectContentByKey } from '../../redux/slices/editors';
import {
  ActionContent,
  Content,
  ContentType,
  EngineSpec,
  ProcessContent,
  ReferenceContent,
  VariableContent,
} from '../../types';
import { useTranslate } from 'react-polyglot';
import React, { JSX, useCallback, useContext, useEffect, useState } from 'react';
import { EditorContext, EditorInfo } from '../FrameEditor/FrameEditor';
import { typePropertyDescription, typePropertyTitle } from '../../util';
import {
  Button,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

type PropertyReferenceModel = {
  path: string[];
  typeId: string;
  optional: boolean;
  title: string;
  description?: string;
};

type PropertyReferenceViewModel = {
  data: PropertyReferenceModel;
  childrenLoaded: boolean;
  children?: PropertyReferenceModel[];
};

export interface ReferenceEditorProps {
  contentKey: string;
}

type PathKey = string;

function pathToKey(path: string[]) {
  return path.join('.') as PathKey;
}

function isKeyDescendant(key: PathKey, possibleDescendant: PathKey) {
  return possibleDescendant.startsWith(key + '.');
}

function isTypeCompound(typeId: string, engineSpec: EngineSpec) {
  return Object.keys(engineSpec.types[typeId].properties).length > 0;
}

export function ReferencePathEditor({ contentKey }: ReferenceEditorProps) {
  const translate = useTranslate();
  const { engineSpec } = useContext(EditorContext) as EditorInfo;

  const [dialogOpen, setDialogOpen] = useState(false);

  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined || content.type !== ContentType.REFERENCE) {
    return null;
  }
  const referenceContent = content as ReferenceContent;
  const referencedContent = useSelector(selectContentByKey(referenceContent.referenceKey));
  if (referencedContent === undefined) {
    return null;
  }
  const variableContent = useSelector(
    selectContentByKey((referencedContent as ActionContent)?.variableContentKey),
  ) as VariableContent;

  const [selectedPath, setSelectedPath] = useState(referenceContent.path);
  const [nodeMap, setNodeMap] = useState(
    new Map<string, PropertyReferenceViewModel>([
      [
        pathToKey([]),
        {
          data: buildRootReference(referenceContent, referencedContent, variableContent),
          childrenLoaded: false,
        },
      ],
    ]),
  );
  const [rootNode] = useState(nodeMap.get('') as PropertyReferenceViewModel);
  const [selectedNode, setSelectedNode] = useState(rootNode);
  const [rootIsCompound] = useState(isTypeCompound(selectedNode.data.typeId, engineSpec));

  const handleLoadChildren = useCallback(
    (path: string[]) => {
      const mapCopy = new Map<string, PropertyReferenceViewModel>(nodeMap);
      let mapUpdated = false;
      const key = pathToKey(path);
      const node = mapCopy.get(key);
      if (node === undefined) {
        throw new Error(`Attempted to load children for missing parent [${key}]`);
      }
      if (!node.childrenLoaded) {
        node.children = buildChildPropertyReferenceModels(node.data, translate, engineSpec);
        node.children.forEach((model) => {
          mapCopy.set(pathToKey(model.path), {
            data: model,
            childrenLoaded: false,
          });
          mapUpdated = true;
        });
      }
      if (mapUpdated) {
        setNodeMap(mapCopy);
      }
      return node.children as PropertyReferenceModel[];
    },
    [nodeMap, setNodeMap, buildChildPropertyReferenceModels, translate, engineSpec],
  );

  // when selection changes, ensure children are loaded and set selected node
  useEffect(() => {
    const mapCopy = new Map<string, PropertyReferenceViewModel>(nodeMap);
    let mapUpdated = false;
    for (let i = 0; i < selectedPath.length; i++) {
      const subPath = selectedPath.slice(0, i);
      const key = pathToKey(subPath);
      const node = nodeMap.get(key);
      if (node === undefined) {
        const parentPath = selectedPath.slice(0, i - 1);
        setSelectedPath(parentPath);
      } else if (!node.childrenLoaded) {
        handleLoadChildren(subPath);
      }
    }
    if (mapUpdated) {
      setNodeMap(mapCopy);
    }
    const selectedNode = nodeMap.get(pathToKey(selectedPath)) as PropertyReferenceViewModel;
    setSelectedNode(selectedNode);
  }, [selectedPath, selectedPath, handleLoadChildren, setSelectedNode]);

  const handleSelection = useCallback((path: string[]) => {
    // TODO dispatch update
  }, []);

  // For initial variables, the first path segment is used to reference which initial variable
  //  to reference. This path segment is kept hidden from users and unavailable for editing.
  const isInitialVarReference = referencedContent.type === ContentType.ACTION;
  const varRootKey = pathToKey(selectedPath.slice(0, isInitialVarReference ? 1 : 0));
  const varRootNode = nodeMap.get(varRootKey) as PropertyReferenceViewModel;

  function renderSelection() {
    const children: JSX.Element[] = [];
    const startIndex = isInitialVarReference ? 2 : 1;
    for (let i = startIndex; i < selectedPath.length; i++) {
      const subPath = selectedPath.slice(0, i);
      const node = nodeMap.get(pathToKey(subPath)) as PropertyReferenceViewModel;
      const data = node.data;
      children.push(
        <Container>
          <Typography>{data.title}</Typography>
        </Container>,
      );
    }
    return children;
  }

  // TODO make this pretty
  return (
    <Stack>
      <Typography>Variable</Typography>
      <Container>
        <Typography>{varRootNode.data.title}</Typography>
      </Container>
      {rootIsCompound && (
        <>
          <Typography>Optionally, select a child property to use:</Typography>
          <Button>{renderSelection()}</Button>
          <ReferenceSelectionDialog
            open={dialogOpen}
            root={varRootNode.data}
            initialSelectedPath={referenceContent.path}
            childLoader={handleLoadChildren}
            onSelection={handleSelection}
            onCancel={() => setDialogOpen(false)}
          />
        </>
      )}
    </Stack>
  );
}

function buildChildPropertyReferenceModels(
  parent: PropertyReferenceModel,
  translate: (key: string) => string,
  engineSpec: EngineSpec,
) {
  const typeId = parent.typeId;
  const typeSpec = engineSpec.types[typeId];
  if (typeSpec === undefined) {
    throw new Error(`Unknown type ID: ${typeId}`);
  }
  return Object.values(typeSpec.properties).map((property) => {
    const propertyName = property.name;
    const title = translate(typePropertyTitle(typeId, propertyName));
    const description = translate(typePropertyDescription(typeId, propertyName));
    return {
      path: [...parent.path, propertyName],
      typeId,
      title,
      description,
      optional: false,
    } as PropertyReferenceModel;
  });
}

function buildRootReference(
  referenceContent: ReferenceContent,
  referencedContent: Content,
  variableContent: VariableContent,
) {
  const path = [...referenceContent.path];
  if (referencedContent.type === ContentType.PROCESS) {
    // A reference to a process indicates an input variable ref, with the first path segment
    //  indicating the variable name
    if (path.length === 0) {
      throw new Error('Input variable references require a variable name');
    }
    const processContent = referencedContent as ProcessContent;
    const processSpec = processContent.spec;
    const varName = path[0];
    const variableSpec = processSpec.inputs[varName];
    if (variableSpec === undefined) {
      throw new Error(`Referenced input variable ${varName} does not exist`);
    }
    return {
      path: [varName],
      typeId: variableSpec.typeId,
      title: variableSpec.title,
      description: variableSpec.description,
      optional: variableSpec.optional,
    };
  } else if (referencedContent.type === ContentType.ACTION) {
    // A reference to an action indicates a local variable ref
    const actionContent = referencedContent as ActionContent;
    const actionSpec = actionContent.spec;
    const typeId = actionSpec.outputTypeId;
    if (typeId === null) {
      throw new Error('Referenced local variable does not exist');
    }
    let title = variableContent.title;
    let description = variableContent.description;
    return {
      path: [],
      typeId,
      title,
      description,
      optional: false,
    };
  } else {
    // Other types are invalid
    throw new Error(`Invalid content reference type: ${referencedContent.type}`);
  }
}

interface ReferenceSelectionDialogProps {
  open: boolean;
  root: PropertyReferenceModel;
  initialSelectedPath: string[];
  childLoader: (path: string[]) => PropertyReferenceModel[];
  onSelection: (path: string[]) => void;
  onCancel: () => void;
}

function ReferenceSelectionDialog({
  open,
  root,
  initialSelectedPath,
  childLoader,
  onSelection,
  onCancel,
}: ReferenceSelectionDialogProps) {
  const [selectedPath, setSelectedPath] = useState(initialSelectedPath);
  const [nodeMap, setNodeMap] = useState(
    new Map<string, PropertyReferenceViewModel>([
      [
        pathToKey([]),
        {
          data: root,
          childrenLoaded: false,
        },
      ],
    ]),
  );

  useEffect(() => {
    const mapCopy = new Map<string, PropertyReferenceViewModel>(nodeMap);
    let mapUpdated = false;
    for (let i = 0; i < selectedPath.length; i++) {
      const subPath = selectedPath.slice(0, i);
      const key = pathToKey(subPath);
      const node = nodeMap.get(key);
      if (node === undefined) {
        const parentPath = selectedPath.slice(0, i - 1);
        setSelectedPath(parentPath);
      } else if (!node.childrenLoaded) {
        node.children = childLoader(subPath);
        node.children.forEach((model) => {
          mapCopy.set(pathToKey(model.path), {
            data: model,
            childrenLoaded: false,
          });
          mapUpdated = true;
        });
      }
    }
    if (mapUpdated) {
      setNodeMap(mapCopy);
    }
  }, [selectedPath, selectedPath, nodeMap, setNodeMap, childLoader]);

  const handleLoadChildren = useCallback(
    (path: string[]) => {
      const mapCopy = new Map<string, PropertyReferenceViewModel>(nodeMap);
      let mapUpdated = false;
      const key = pathToKey(path);
      const node = mapCopy.get(key);
      if (node === undefined) {
        throw new Error(`Attempted to load children for missing parent [${key}]`);
      }
      if (!node.childrenLoaded) {
        node.children = childLoader(path);
        node.children.forEach((model) => {
          mapCopy.set(pathToKey(model.path), {
            data: model,
            childrenLoaded: false,
          });
          mapUpdated = true;
        });
      }
      if (mapUpdated) {
        setNodeMap(mapCopy);
      }
      return node.children as PropertyReferenceModel[];
    },
    [nodeMap, setNodeMap, childLoader],
  );

  return (
    <Dialog open={open} title={'Edit Reference'} sx={{ p: 2 }}>
      <DialogTitle>Edit Reference</DialogTitle>
      <Stack>
        <ReferenceSegmentButton
          model={nodeMap.get('')?.data as PropertyReferenceModel}
          selectedPathKey={pathToKey(selectedPath)}
          select={onSelection}
          loadChildren={handleLoadChildren}
        />
      </Stack>
      <DialogActions>
        <Button onClick={onCancel} variant={'outlined'}>
          Cancel
        </Button>
        <Button onClick={() => onSelection(selectedPath)} variant={'contained'} color={'primary'}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ReferenceSegmentButtonProps {
  model: PropertyReferenceModel;
  selectedPathKey: PathKey;
  select: (path: string[]) => void;
  loadChildren: (path: string[]) => PropertyReferenceModel[];
}

function ReferenceSegmentButton({
  model,
  selectedPathKey,
  select,
  loadChildren,
}: ReferenceSegmentButtonProps) {
  const [children, setChildren] = useState<PropertyReferenceModel[] | undefined>();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(false);

  // open or close the child display depending on the current selection
  useEffect(() => {
    const thisPathKey = pathToKey(model.path);
    const directlySelected = selectedPathKey === thisPathKey;
    const inSelectionPath = directlySelected || isKeyDescendant(thisPathKey, selectedPathKey);
    setSelected(directlySelected);
    setOpen(inSelectionPath);
  }, [model, selectedPathKey, setOpen]);

  // load the children the first time the child display is opened
  useEffect(() => {
    if (open && children === undefined) {
      setChildren(loadChildren(model.path));
    }
  }, [model, open, loadChildren, children, setChildren]);

  return (
    <Container>
      <Button color={selected ? 'primary' : 'secondary'} onClick={() => select(model.path)}>
        {model.title}
      </Button>
      <Collapse in={open} sx={{ pl: 1 }}>
        {children?.map((child) => {
          return (
            <ReferenceSegmentButton
              model={child}
              selectedPathKey={selectedPathKey}
              select={select}
              loadChildren={loadChildren}
            />
          );
        })}
      </Collapse>
    </Container>
  );
}
