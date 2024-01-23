import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EditorContext, EditorInfo } from '../FrameEditor/FrameEditor';
import {
  ActionContent,
  Content,
  ContentType,
  FunctionContent,
  ListContent,
  ParameterSpec,
  ValueContent,
} from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import {
  addValue,
  deleteItem,
  reorderItem,
  selectContentByKey,
  selectParameterSpecificationForKey,
  selectSelectedSubtree,
  setSelection,
  setValue,
} from '../../redux/slices/editors';
import { ParameterHeading } from '../ParameterHeading/ParameterHeading';
import { Box, Button, IconButton, ListItemButton, ListItemText } from '@mui/material';
import { useTranslate } from 'react-polyglot';
import {
  actionParameterDescriptionPath,
  actionParameterTitlePath,
  functionDescriptionPath,
  functionParameterDescriptionPath,
  functionParameterTitlePath,
  functionTitlePath,
} from '../../util';
import MenuIcon from '@mui/icons-material/Menu';
import { StoreStructure } from '../../redux';
import { ContextMenu, ContextMenuAction } from '../ContextMenu/ContentMenu';
import { DropResult } from '@hello-pangea/dnd';
import { ReorderableContentList } from '../ReorderableContentList/ReorderableContentList';
import { ValueEditor } from '../ValueEditor/ValueEditor';
import { FunctionIcon } from '../Icons/Icons';

export interface InputParameterListProps {
  contentKey: string;
  name: string;
  parent: Content;
}

export function InputParameterList({ contentKey, name, parent }: InputParameterListProps) {
  const { editorId, engineSpec } = useContext(EditorContext) as EditorInfo;

  const content = useSelector(selectContentByKey(editorId, contentKey));
  const selection = useSelector((state: StoreStructure) => selectSelectedSubtree(state, editorId));
  const selectionDepth =
    selection !== undefined
      ? selection.findIndex((selectedContent) => contentKey === selectedContent.key)
      : -1;
  const parameterSpec = useSelector(
    selectParameterSpecificationForKey(editorId, contentKey),
  ) as ParameterSpec;

  function isChildSelected(contentKey: string) {
    if (selectionDepth >= 0 && selection !== undefined && selectionDepth + 1 < selection.length) {
      const selectedChild = selection[selectionDepth + 1];
      return selectedChild.key === contentKey;
    }
    return false;
  }

  const dispatch = useDispatch();
  const translate = useTranslate();

  const handleAddItem = useCallback(() => {
    dispatch(addValue(contentKey, editorId));
  }, [dispatch, editorId]);

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
        <InputButton
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
    if (content.type !== ContentType.INPUT_LIST) {
      throw new Error(
        `Unexpected state at key ${content.key} -- expected actions, found ${content.type}`,
      );
    }
    const listState = content as ListContent;

    let title = '';
    let description = '';
    if (parent.type === ContentType.ACTION) {
      const actionEditorState = parent as ActionContent;
      title = translate(actionParameterTitlePath(actionEditorState.name, name));
      description = translate(actionParameterDescriptionPath(actionEditorState.name, name));
    } else {
      const functionContent = parent as FunctionContent;
      title = translate(functionParameterTitlePath(functionContent.name, name));
      description = translate(functionParameterDescriptionPath(functionContent.name, name));
    }

    return (
      <Box sx={{ mx: 2, my: 1 }}>
        <ParameterHeading title={title} description={description} subtitle={description} />
        <ReorderableContentList
          parentKey={parent.key}
          onDragEnd={handleDragEnd}
          allowReorder={parameterSpec.multi}
          childKeys={listState.childKeys}
          renderChildContent={handleRenderChildContent}
          renderSecondaryAction={handleRenderContextMenuButton}
        />
        {parameterSpec.multi && (
          <Box sx={{ display: 'flex', flexDirection: 'row-reverse', width: '100%' }}>
            <Button onClick={handleAddItem}>Add Value</Button>
          </Box>
        )}
      </Box>
    );
  }
  return null;
}

interface ContextMenuButtonProps {
  editorId: string;
  contentKey: string;
}

function ContextMenuButton({ editorId, contentKey }: ContextMenuButtonProps) {
  const dispatch = useDispatch();

  const parameterSpec = useSelector(selectParameterSpecificationForKey(editorId, contentKey));

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
    if (parameterSpec !== undefined && !parameterSpec.multi) {
      dispatch(setValue('', editorId, contentKey));
    } else {
      dispatch(deleteItem(contentKey, editorId));
    }
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

interface InputButtonProps {
  editorId: string;
  contentKey: string;
  selected: boolean;
}

function InputButton({ editorId, contentKey, selected }: InputButtonProps) {
  const dispatch = useDispatch();
  const content = useSelector(selectContentByKey(editorId, contentKey));
  const parameterSpec = useSelector(selectParameterSpecificationForKey(editorId, contentKey));

  const handleClick = useCallback(() => {
    dispatch(setSelection(contentKey, editorId));
  }, [dispatch, editorId, contentKey]);

  const translate = useTranslate();

  if (content !== undefined) {
    if (content.type === ContentType.FUNCTION) {
      const functionContent = content as FunctionContent;

      const title = translate(functionTitlePath(functionContent.name));
      const description = translate(functionDescriptionPath(functionContent.name));

      return (
        <ListItemButton selected={selected} onClick={handleClick}>
          <FunctionIcon sx={{ mr: 1 }} />
          <ListItemText primary={title} secondary={<span>{description}</span>} />
        </ListItemButton>
      );
    } else if (content.type === ContentType.VALUE && parameterSpec !== undefined) {
      return (
        <ListItemButton selected={selected} onClick={handleClick}>
          <ValueEditor parameterSpec={parameterSpec} content={content as ValueContent} />
        </ListItemButton>
      );
    }
  }
  return null;
}
