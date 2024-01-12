import React, { useCallback, useContext, useEffect, useState } from 'react';
import { EditorContext, EditorInfo } from '../FrameEditor/FrameEditor';
import {
  ActionContent,
  Content,
  ContentType,
  FunctionContent,
  ListContent,
  ParameterSpec,
  ProcessContent,
  ValueContent,
} from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import {
  addValue,
  selectContentByKey,
  selectParameterSpecificationForKey,
  setSelection,
  selectSelectedSubtree,
  selectIsKeySelected,
  reorderItem,
  deleteItem,
} from '../../redux/slices/editors';
import { ParameterHeading } from '../ParameterHeading/ParameterHeading';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { useTranslate } from 'react-polyglot';
import {
  actionDescriptionPath,
  actionParameterDescriptionPath,
  actionParameterTitlePath,
  actionTitlePath,
  functionDescriptionPath,
  functionParameterDescriptionPath,
  functionParameterTitlePath,
  functionTitlePath,
  processParameterDescriptionPath,
  processParameterTitlePath,
} from '../../util/translation-paths';
import MenuIcon from '@mui/icons-material/Menu';
import RunIcon from '@mui/icons-material/DirectionsRun';
import { FunctionIcon } from '../Icons/Icons';
import { ValueEditor } from '../ValueEditor/ValueEditor';
import { StoreStructure } from '../../redux/types';
import { ContextMenu, ContextMenuAction } from '../ContextMenu/ContentMenu';
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DropResult,
  OnDragEndResponder,
} from '@hello-pangea/dnd';

export interface ParameterListProps {
  contentKey: string;
  name: string;
  parent: Content;
}

export function ParameterList({ contentKey, name, parent }: ParameterListProps) {
  const { editorId } = useContext(EditorContext) as EditorInfo;

  const content = useSelector(selectContentByKey(editorId, contentKey));
  const selection = useSelector((state: StoreStructure) => selectSelectedSubtree(state, editorId));

  const dispatch = useDispatch();
  const translate = useTranslate();

  const addItemFunction = useCallback(() => {
    if (content !== undefined) {
      dispatch(addValue(content.key, editorId));
    }
  }, []);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (result.destination) {
        const startIndex = result.source.index;
        const endIndex = result.destination.index;
        dispatch(reorderItem(contentKey, editorId, startIndex, endIndex));
      }
    },
    [dispatch, editorId],
  );

  const parameterSpec = useSelector(selectParameterSpecificationForKey(editorId, content?.key));

  if (content !== undefined && selection !== undefined) {
    if (content.type !== ContentType.ACTION_LIST && content.type !== ContentType.INPUT_LIST) {
      throw new Error(
        `Unexpected state at key ${content.key} -- expected actions, found ${content.type}`,
      );
    }
    const listState = content as ListContent;

    let title = '';
    let description = '';
    if (parent.type === ContentType.PROCESS) {
      const processEditorState = parent as ProcessContent;
      title = translate(processParameterTitlePath(processEditorState.name, name));
      description = translate(processParameterDescriptionPath(processEditorState.name, name));
    }
    if (parent.type === ContentType.ACTION) {
      const actionEditorState = parent as ActionContent;
      title = translate(actionParameterTitlePath(actionEditorState.name, name));
      description = translate(actionParameterDescriptionPath(actionEditorState.name, name));
    } else if (parent.type === ContentType.FUNCTION) {
      const functionEditorState = parent as FunctionContent;
      title = translate(functionParameterTitlePath(functionEditorState.name, name));
      description = translate(functionParameterDescriptionPath(functionEditorState.name, name));
    }

    const allowReorder = parameterSpec === undefined || parameterSpec.multi;

    return (
      <Box sx={{ mx: 2, my: 1 }}>
        <ParameterHeading title={title} description={description} subtitle={description} />
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={contentKey} direction={'vertical'} isDropDisabled={!allowReorder}>
            {(droppableProvider) => (
              <List ref={droppableProvider.innerRef} {...droppableProvider.droppableProps}>
                {listState.childKeys.map((childKey, index) => {
                  return (
                    <Draggable
                      key={childKey}
                      draggableId={childKey}
                      index={index}
                      isDragDisabled={!allowReorder}
                    >
                      {(draggableProvider) => (
                        <ListItemWrapper
                          key={childKey}
                          editorId={editorId}
                          parameterSpec={parameterSpec}
                          contentKey={childKey}
                          last={index === listState.childKeys.length - 1}
                          draggableProvided={draggableProvider}
                        ></ListItemWrapper>
                      )}
                    </Draggable>
                  );
                })}
                {droppableProvider.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
        {renderControls(addItemFunction, parameterSpec)}
      </Box>
    );
  }
  return <div />;
}

interface ListItemWrapperProps {
  editorId: string;
  contentKey: string;
  parameterSpec: ParameterSpec | undefined;
  last: boolean;
  draggableProvided: DraggableProvided;
}

function ListItemWrapper({
  editorId,
  contentKey,
  parameterSpec,
  last,
  draggableProvided,
}: ListItemWrapperProps) {
  const content = useSelector(selectContentByKey(editorId, contentKey)) as Content;
  const selected = useSelector(selectIsKeySelected(editorId, contentKey));
  switch (content.type) {
    case ContentType.ACTION:
      return (
        <ActionListItem
          content={content as ActionContent}
          editorId={editorId}
          selected={selected}
          last={last}
          draggableProvided={draggableProvided}
        />
      );
    case ContentType.FUNCTION:
      return (
        <FunctionListItem
          content={content as FunctionContent}
          editorId={editorId}
          selected={selected}
          parameterSpec={parameterSpec as ParameterSpec}
          last={last}
          draggableProvided={draggableProvided}
        />
      );
    case ContentType.VALUE:
      return (
        <ValueListItem
          content={content as ValueContent}
          editorId={editorId}
          selected={selected}
          parameterSpec={parameterSpec as ParameterSpec}
          last={last}
          draggableProvided={draggableProvided}
        />
      );
  }
  return null;
}

function renderControls(addItem: () => void, parameterSpec: ParameterSpec | undefined) {
  if (parameterSpec !== undefined && parameterSpec.multi) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row-reverse', width: '100%' }}>
        <Button onClick={addItem}>Add</Button>
      </Box>
    );
  } else {
    return <span />;
  }
}

interface ListItemProps<T extends Content> {
  content: T;
  editorId: string;
  selected: boolean;
  last: boolean;
  draggableProvided: DraggableProvided;
}

export interface ActionListItemProps extends ListItemProps<ActionContent> {}

export function ActionListItem({
  editorId,
  content,
  selected,
  last,
  draggableProvided,
}: ActionListItemProps) {
  const dispatch = useDispatch();

  const translate = useTranslate();

  const doDelete = useCallback(() => {
    if (content !== undefined) {
      dispatch(deleteItem(content.key, editorId));
    }
  }, []);

  const actions: ContextMenuAction[] = [
    {
      title: 'Delete',
      id: 'delete',
      onClick: doDelete,
    },
  ];

  if (content != undefined && content.type === ContentType.ACTION) {
    const action = content as ActionContent;

    const title = translate(actionTitlePath(action.name));
    const description = translate(actionDescriptionPath(action.name));

    return (
      <ParameterListItem
        editorId={editorId}
        actions={actions}
        content={content}
        selected={selected}
        last={last}
        draggableProvided={draggableProvided}
      >
        <RunIcon sx={{ mr: 1 }} />
        <ListItemText primary={title} secondary={<span>{description}</span>} />
      </ParameterListItem>
    );
  }
  return null;
}

export interface FunctionListItemProps extends ListItemProps<FunctionContent> {
  parameterSpec: ParameterSpec;
}

export function FunctionListItem({
  editorId,
  content,
  selected,
  parameterSpec,
  last,
  draggableProvided,
}: FunctionListItemProps) {
  const dispatch = useDispatch();

  const translate = useTranslate();

  const doDelete = useCallback(() => {
    if (content !== undefined) {
      dispatch(deleteItem(content.key, editorId));
    }
  }, []);

  const actions: ContextMenuAction[] = [];

  if (parameterSpec.multi) {
    actions.push({
      title: 'Delete',
      id: 'delete',
      onClick: doDelete,
    });
  }

  if (content !== undefined && content.type === ContentType.FUNCTION) {
    const functionContent = content as FunctionContent;

    const title = translate(functionTitlePath(functionContent.name));
    const description = translate(functionDescriptionPath(functionContent.name));

    return (
      <ParameterListItem
        editorId={editorId}
        actions={actions}
        content={content}
        selected={selected}
        last={last}
        draggableProvided={draggableProvided}
      >
        <FunctionIcon sx={{ mr: 1 }} />
        <ListItemText primary={title} secondary={<span>{description}</span>} />
      </ParameterListItem>
    );
  }
  return null;
}

export interface ValueListItemProps extends ListItemProps<ValueContent> {
  parameterSpec: ParameterSpec;
}

export function ValueListItem({
  editorId,
  content,
  selected,
  parameterSpec,
  last,
  draggableProvided,
}: ValueListItemProps) {
  const dispatch = useDispatch();

  const doDelete = useCallback(() => {
    if (content !== undefined) {
      dispatch(deleteItem(content.key, editorId));
    }
  }, []);

  const actions: ContextMenuAction[] = [];

  if (parameterSpec.multi) {
    actions.push({
      title: 'Delete',
      id: 'delete',
      onClick: doDelete,
    });
  }

  if (content != undefined && content.type === ContentType.VALUE) {
    const value = content as ValueContent;

    return (
      <ParameterListItem
        editorId={editorId}
        actions={actions}
        content={content}
        selected={selected}
        last={last}
        draggableProvided={draggableProvided}
      >
        <ValueEditor parameterSpec={parameterSpec} content={value} />
      </ParameterListItem>
    );
  }
  return null;
}

export interface ParameterListItemProps {
  editorId: string;
  actions?: ContextMenuAction[];
  content: Content;
  selected: boolean;
  last: boolean;
  children: React.JSX.Element[] | React.JSX.Element | null;
  draggableProvided: DraggableProvided;
}

export function ParameterListItem({
  editorId,
  actions,
  content,
  selected,
  last,
  children,
  draggableProvided,
}: ParameterListItemProps) {
  const dispatch = useDispatch();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(anchorEl !== null);
  }, [anchorEl]);
  const handleClickMenuHandle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    event.stopPropagation();
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };

  if (content != undefined) {
    return (
      <ListItem
        key={content.key}
        onClick={() => dispatch(setSelection(content.key, editorId))}
        disablePadding
        divider={!last}
        secondaryAction={
          <div>
            <IconButton
              edge="end"
              aria-label="actions"
              onClick={handleClickMenuHandle}
              {...draggableProvided.dragHandleProps}
            >
              <MenuIcon />
            </IconButton>
            <ContextMenu
              anchorEl={anchorEl}
              open={open}
              handleClose={handleClose}
              actions={actions}
            />
          </div>
        }
        ref={draggableProvided.innerRef}
        {...draggableProvided.draggableProps}
      >
        <ListItemButton selected={selected}>{children}</ListItemButton>
      </ListItem>
    );
  }
  return null;
}
