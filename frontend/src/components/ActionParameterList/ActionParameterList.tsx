import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EditorContext, EditorInfo } from '../FrameEditor/FrameEditor';
import {
  ActionContent,
  ActionSpec,
  Content,
  ContentType,
  ListContent,
  ProcessContent,
} from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import {
  addAction,
  deleteItem,
  reorderItem,
  selectContentByKey,
  selectSelectedSubtree,
  setSelection,
} from '../../redux/slices/editors';
import { ParameterHeading } from '../ParameterHeading/ParameterHeading';
import {
  Box,
  Button,
  Dialog,
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
  processParameterDescriptionPath,
  processParameterTitlePath,
} from '../../util';
import MenuIcon from '@mui/icons-material/Menu';
import RunIcon from '@mui/icons-material/DirectionsRun';
import { StoreStructure } from '../../redux';
import { ContextMenu, ContextMenuAction } from '../ContextMenu/ContentMenu';
import { DropResult } from '@hello-pangea/dnd';
import { ReorderableContentList } from '../ReorderableContentList/ReorderableContentList';

export interface ActionParameterListProps {
  contentKey: string;
  name: string;
  parent: Content;
}

export function ActionParameterList({ contentKey, name, parent }: ActionParameterListProps) {
  const { editorId, engineSpec } = useContext(EditorContext) as EditorInfo;

  const [dialogOpen, setDialogOpen] = useState(false);

  const content = useSelector(selectContentByKey(editorId, contentKey));
  const selection = useSelector((state: StoreStructure) => selectSelectedSubtree(state, editorId));
  const selectionDepth =
    selection !== undefined
      ? selection.findIndex((selectedContent) => contentKey === selectedContent.key)
      : -1;

  function isChildSelected(contentKey: string) {
    if (selectionDepth >= 0 && selection !== undefined && selectionDepth + 1 < selection.length) {
      const selectedChild = selection[selectionDepth + 1];
      return selectedChild.key === contentKey;
    }
    return false;
  }

  const dispatch = useDispatch();
  const translate = useTranslate();

  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, [setDialogOpen]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, [setDialogOpen]);

  const handleAddItem = useCallback(
    (actionName: string) => {
      dispatch(addAction(contentKey, editorId, actionName));
      setDialogOpen(false);
    },
    [dispatch, editorId],
  );

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

  const handleRenderChildContent = useCallback(
    (childKey: string) => {
      return (
        <ActionButton
          editorId={editorId}
          contentKey={childKey}
          selected={isChildSelected(childKey)}
        />
      );
    },
    [editorId],
  );

  const handleRenderContextMenuButton = useCallback(
    (childKey: string) => {
      return <ContextMenuButton editorId={editorId} contentKey={childKey} />;
    },
    [editorId],
  );

  if (content !== undefined && selection !== undefined) {
    if (content.type !== ContentType.PROCESS && content.type !== ContentType.ACTION_LIST) {
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
    } else if (parent.type === ContentType.ACTION) {
      const actionEditorState = parent as ActionContent;
      title = translate(actionParameterTitlePath(actionEditorState.name, name));
      description = translate(actionParameterDescriptionPath(actionEditorState.name, name));
    }

    return (
      <Box sx={{ mx: 2, my: 1 }}>
        <ParameterHeading title={title} description={description} subtitle={description} />
        <ReorderableContentList
          parentKey={parent.key}
          onDragEnd={handleDragEnd}
          allowReorder={true}
          childKeys={listState.childKeys}
          renderChildContent={handleRenderChildContent}
          renderSecondaryAction={handleRenderContextMenuButton}
        />
        <Box sx={{ display: 'flex', flexDirection: 'row-reverse', width: '100%' }}>
          <Button onClick={openDialog} disabled={dialogOpen}>
            Add Action
          </Button>
        </Box>
        <ActionSelectionDialog
          open={dialogOpen}
          cancel={closeDialog}
          select={handleAddItem}
          actions={engineSpec.actions}
        />
      </Box>
    );
  }
  return <div />;
}

interface ContextMenuButtonProps {
  editorId: string;
  contentKey: string;
}

function ContextMenuButton({ editorId, contentKey }: ContextMenuButtonProps) {
  const dispatch = useDispatch();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(anchorEl !== null);
  }, [anchorEl]);

  const handleClickMenuHandle = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
      event.stopPropagation();
    },
    [setAnchorEl],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setAnchorEl(null);
  }, [setOpen, setAnchorEl]);

  const handleDelete = useCallback(() => {
    dispatch(deleteItem(contentKey, editorId));
  }, [dispatch, editorId, contentKey]);

  const actions: ContextMenuAction[] = useMemo(
    () => [
      {
        onClick: handleDelete,
        title: 'Delete',
        id: 'delete',
      },
    ],
    [handleDelete],
  );

  return (
    <div>
      <IconButton edge="end" aria-label="actions" onClick={handleClickMenuHandle}>
        <MenuIcon />
      </IconButton>
      <ContextMenu anchorEl={anchorEl} open={open} handleClose={handleClose} actions={actions} />
    </div>
  );
}

interface ActionButtonProps {
  editorId: string;
  contentKey: string;
  selected: boolean;
}

function ActionButton({ editorId, contentKey, selected }: ActionButtonProps) {
  const dispatch = useDispatch();
  const content = useSelector(selectContentByKey(editorId, contentKey));

  const translate = useTranslate();

  const handleClick = useCallback(() => {
    dispatch(setSelection(contentKey, editorId));
  }, [dispatch, editorId, contentKey]);

  if (content != undefined && content.type === ContentType.ACTION) {
    const action = content as ActionContent;

    const title = translate(actionTitlePath(action.name));
    const description = translate(actionDescriptionPath(action.name));

    return (
      <ListItemButton selected={selected} onClick={handleClick}>
        <RunIcon sx={{ mr: 1 }} />
        <ListItemText primary={title} secondary={<span>{description}</span>} />
      </ListItemButton>
    );
  }
  return null;
}

interface ActionSelectionDialogProps {
  open: boolean;
  cancel: () => void;
  select: (actionName: string) => void;
  actions: { [key: string]: ActionSpec };
}

function ActionSelectionDialog({ open, cancel, select, actions }: ActionSelectionDialogProps) {
  const translate = useTranslate();
  return (
    <Dialog open={open}>
      <List>
        {Object.entries(actions).map(([name]) => {
          const title = translate(actionTitlePath(name));
          const description = translate(actionDescriptionPath(name));
          return (
            <ListItem key={name}>
              <ListItemButton onClick={() => select(name)}>
                <ListItemText primary={title} secondary={<span>{description}</span>} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ display: 'flex', flexDirection: 'row-reverse', width: '100%' }}>
        <Button onClick={cancel}>Cancel</Button>
      </Box>
    </Dialog>
  );
}
