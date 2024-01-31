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
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Input,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
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
import { Search } from '@mui/icons-material';

export interface ActionParameterListProps {
  contentKey: string;
  name: string;
  parent: Content;
}

export function ActionParameterList({ contentKey, name, parent }: ActionParameterListProps) {
  const { engineSpec } = useContext(EditorContext) as EditorInfo;

  const [dialogOpen, setDialogOpen] = useState(false);

  const content = useSelector(selectContentByKey(contentKey));
  const selection = useSelector((state: StoreStructure) => selectSelectedSubtree(state));
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

  const openDialog = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setDialogOpen(true);
      event.currentTarget.blur();
    },
    [setDialogOpen],
  );

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, [setDialogOpen]);

  const handleAddItem = useCallback(
    (actionName: string) => {
      dispatch(addAction(contentKey, actionName));
      setDialogOpen(false);
    },
    [dispatch, setDialogOpen],
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (result.destination) {
        const startIndex = result.source.index;
        const endIndex = result.destination.index;
        dispatch(reorderItem(contentKey, startIndex, endIndex));
      }
    },
    [dispatch],
  );

  const handleRenderChildContent = useCallback((childKey: string) => {
    return <ActionButton contentKey={childKey} selected={isChildSelected(childKey)} />;
  }, []);

  const handleRenderContextMenuButton = useCallback((childKey: string) => {
    return <ContextMenuButton contentKey={childKey} />;
  }, []);

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
          actions={Object.keys(engineSpec.actions)}
        />
      </Box>
    );
  }
  return <div />;
}

interface ContextMenuButtonProps {
  contentKey: string;
}

function ContextMenuButton({ contentKey }: ContextMenuButtonProps) {
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
    dispatch(deleteItem(contentKey));
  }, [dispatch, contentKey]);

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
  contentKey: string;
  selected: boolean;
}

function ActionButton({ contentKey, selected }: ActionButtonProps) {
  const dispatch = useDispatch();
  const content = useSelector(selectContentByKey(contentKey));

  const translate = useTranslate();

  const handleClick = useCallback(() => {
    dispatch(setSelection(contentKey));
  }, [dispatch, contentKey]);

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
  actions: string[];
}

function ActionSelectionDialog({ open, cancel, select, actions }: ActionSelectionDialogProps) {
  const translate = useTranslate();

  const [searchText, setSearchText] = useState('');
  const [filteredActions, setFilteredActions] = useState(actions);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSearchTextUpdate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.target.value);
    },
    [setSearchText],
  );

  const handleSelect = useCallback(() => {
    select(filteredActions[selectedIndex]);
  }, [select, selectedIndex, filteredActions]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.code) {
        case 'ArrowUp':
          setSelectedIndex(Math.max(selectedIndex - 1, 0));
          break;
        case 'ArrowDown':
          setSelectedIndex(Math.min(selectedIndex + 1, filteredActions.length - 1));
          break;
        case 'Enter':
          select(filteredActions[selectedIndex]);
          break;
      }
    },
    [selectedIndex, setSelectedIndex, filteredActions, select],
  );

  useEffect(() => {
    setSelectedIndex(0);
    const filtered: string[] = [];
    actions.forEach((actionName) => {
      if (matches(searchText, actionName, translate)) {
        filtered.push(actionName);
      }
    });
    setFilteredActions(filtered);
  }, [searchText, actions, setSelectedIndex, setFilteredActions]);

  return (
    <Dialog open={open} title={'Add Action'} sx={{ p: 2 }}>
      <DialogTitle>Add Action</DialogTitle>
      <Stack>
        <Input
          placeholder={'Filter Actions'}
          value={searchText}
          onChange={handleSearchTextUpdate}
          onKeyDown={handleSearchKeyDown}
          autoFocus={true}
          endAdornment={
            <InputAdornment position="end">
              <IconButton edge="end">
                <Search></Search>
              </IconButton>
            </InputAdornment>
          }
          sx={{ mx: 2 }}
        />
        <List sx={{ mt: 1, minWidth: '400px', minHeight: '500px' }}>
          {filteredActions.map((name, index) => {
            const title = translate(actionTitlePath(name));
            const description = translate(actionDescriptionPath(name));
            return (
              <ListItem key={name}>
                <ListItemButton onClick={() => select(name)} selected={index === selectedIndex}>
                  <ListItemText primary={title} secondary={<span>{description}</span>} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Stack>
      <DialogActions>
        <Button onClick={cancel} variant={'outlined'}>
          Cancel
        </Button>
        <Button onClick={handleSelect} variant={'contained'} color={'primary'}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function matches(
  searchString: string,
  actionName: string,
  translate: (key: string) => string,
): boolean {
  const searchStringUppercase = searchString.toUpperCase();
  return (
    actionName.toUpperCase().includes(searchStringUppercase) ||
    translate(actionTitlePath(actionName)).toUpperCase().includes(searchStringUppercase) ||
    translate(actionDescriptionPath(actionName)).toUpperCase().includes(searchStringUppercase)
  );
}
