import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionContent,
  Content,
  ContentType,
  ExpressionSpec,
  FunctionContent,
  ListContent,
} from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import {
  addInputValue,
  deleteItem,
  reorderInput,
  selectContentByKey,
  selectParameterSpecificationForKey,
  selectSelectedSubtree,
  setSelection,
  setValue,
} from '../../redux/slices/editors';
import { Box, Button, IconButton, ListItemButton, ListItemText } from '@mui/material';
import {
  actionParameterDescriptionKey,
  actionParameterTitleKey,
  functionDescriptionKey,
  functionParameterDescriptionKey,
  functionParameterTitleKey,
  functionTitleKey,
} from '../../util';
import MenuIcon from '@mui/icons-material/Menu';
import { StoreStructure } from '../../redux';
import { ContextMenu, ContextMenuAction } from '../ContextMenu/ContentMenu';
import { DropResult } from '@hello-pangea/dnd';
import { ReorderableContentList } from '../ReorderableContentList/ReorderableContentList';
import { ValueEditor } from '../ValueEditor/ValueEditor';
import { FunctionIcon } from '../Icons/Icons';
import { useTranslate } from '../I18n/I18n';

export interface InputParameterListProps {
  contentKey: string;
  name: string;
  parent: Content;
}

export function InputParameterList({ contentKey, name, parent }: InputParameterListProps) {
  const content = useSelector(selectContentByKey(contentKey));
  const selection = useSelector((state: StoreStructure) => selectSelectedSubtree(state));
  const selectionDepth =
    selection !== undefined
      ? selection.findIndex((selectedContent) => contentKey === selectedContent.key)
      : -1;
  const parameterSpec = useSelector(
    selectParameterSpecificationForKey(contentKey),
  ) as ExpressionSpec;

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
    dispatch(addInputValue(contentKey));
  }, [dispatch]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (result.destination) {
        const startIndex = result.source.index;
        const endIndex = result.destination.index;
        dispatch(reorderInput(contentKey, startIndex, endIndex));
      }
    },
    [dispatch],
  );

  const handleRenderChildContent = useCallback((childKey: string) => {
    return <InputButton contentKey={childKey} selected={isChildSelected(childKey)} />;
  }, []);

  const handleRenderContextMenuButton = useCallback((childKey: string) => {
    return <ContextMenuButton contentKey={childKey} />;
  }, []);

  if (content !== undefined && selection !== undefined) {
    if (content.type !== ContentType.ARGUMENT) {
      throw new Error(
        `Unexpected state at key ${content.key} -- expected actions, found ${content.type}`,
      );
    }
    const listState = content as ListContent;

    let title: string;
    let description: string;
    if (parent.type === ContentType.ACTION) {
      const actionContent = parent as ActionContent;
      title = translate(actionParameterTitleKey(actionContent.name, name));
      description = translate(actionParameterDescriptionKey(actionContent.name, name));
    } else {
      const functionContent = parent as FunctionContent;
      title = translate(functionParameterTitleKey(functionContent.name, name));
      description = translate(functionParameterDescriptionKey(functionContent.name, name));
    }

    return (
      <>
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
      </>
    );
  }
  return null;
}

interface ContextMenuButtonProps {
  contentKey: string;
}

function ContextMenuButton({ contentKey }: ContextMenuButtonProps) {
  const dispatch = useDispatch();

  const parameterSpec = useSelector(selectParameterSpecificationForKey(contentKey));

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
      dispatch(setValue('', contentKey));
    } else {
      dispatch(deleteItem(contentKey));
    }
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

interface InputButtonProps {
  contentKey: string;
  selected: boolean;
}

function InputButton({ contentKey, selected }: InputButtonProps) {
  const dispatch = useDispatch();
  const content = useSelector(selectContentByKey(contentKey));
  const parameterSpec = useSelector(selectParameterSpecificationForKey(contentKey));

  const handleClick = useCallback(() => {
    dispatch(setSelection(contentKey));
  }, [dispatch, contentKey]);

  const translate = useTranslate();

  if (content !== undefined) {
    if (content.type === ContentType.FUNCTION) {
      const functionContent = content as FunctionContent;

      const title = translate(functionTitleKey(functionContent.name));
      const description = translate(functionDescriptionKey(functionContent.name));

      return (
        <ListItemButton selected={selected} onClick={handleClick}>
          <FunctionIcon sx={{ mr: 1 }} />
          <ListItemText primary={title} secondary={<span>{description}</span>} />
        </ListItemButton>
      );
    } else if (content.type === ContentType.VALUE && parameterSpec !== undefined) {
      return (
        <ListItemButton selected={selected} onClick={handleClick}>
          <ValueEditor contentKey={contentKey} />
        </ListItemButton>
      );
    }
  }
  return null;
}
