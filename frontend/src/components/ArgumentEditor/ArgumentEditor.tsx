import {
  ArgumentContent,
  Content,
  ContentKey,
  ContentType,
  FunctionContent,
  ReferenceContent,
  ValueContent,
  VariableContent,
} from '../../types';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslate } from '../I18n/I18n';
import {
  addInputValue,
  deleteItem,
  reorderInput,
  selectContent,
  selectEngineSpec,
  selectIsInSelectedPath,
  selectParameterSpecificationForKey,
  setSelection,
} from '../../redux/slices/frameEditorSlice';
import { useContent } from '../../hooks/useContent';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ValueEditor } from '../ValueEditor/ValueEditor';
import { Box, ListItemButton, ListItemText, Stack } from '@mui/material';
import { AddIcon, FunctionIcon, ReferenceIcon } from '../Icons/Icons';
import { functionDescriptionKey, functionTitleKey, labelKey } from '../../util';
import { ItemInterface, ReactSortable, SortableEvent } from 'react-sortablejs';
import { ReferenceView } from '../ReferenceView/ReferenceView';
import { SubTreeView } from '../SubTreeView/SubTreeView';

import { ContextActions } from '../ContextActions/ContextActions';
import { TypeView } from '../TypeView/TypeView';
import { ReferencePathView } from '../ReferencePathView/ReferencePathView';
import { ReferencePathEditor } from '../ReferencePathEditor/ReferencePathEditor';
import { ListItemView, ListView } from '../SharedElements/SharedElements';

export interface ArgumentEditorProps {
  contentKey: ContentKey;
}

export function ArgumentEditor({ contentKey }: ArgumentEditorProps) {
  const content = useContent<ArgumentContent>(contentKey, ContentType.ARGUMENT);
  const parameterSpec = useSelector(selectParameterSpecificationForKey(contentKey), shallowEqual);
  if (parameterSpec === undefined) {
    throw new Error(`Failed to load parameter spec for argument ${contentKey}`);
  }
  const { multi } = parameterSpec;

  const props = {
    content,
    key: 'editor',
  };

  return multi ? <MultiArgumentEditor {...props} /> : <SingleArgumentEditor {...props} />;
}

interface InternalArgumentEditorProps {
  content: ArgumentContent;
}

function SingleArgumentEditor({ content }: InternalArgumentEditorProps) {
  const childKeys = content.childKeys;
  if (childKeys.length !== 1) {
    throw new Error(
      `Illegal state: argument content ${content.key} has ${childKeys.length} but a single element is expected`,
    );
  }
  const childKey = childKeys[0];
  const childContent = useContent<FunctionContent | ReferenceContent | ValueContent>(childKey);
  return (
    <ListView>
      <ListItemView key={childKey}>
        <ExpressionEditor
          key="single-item"
          content={childContent}
          id={childKey}
          hideOverflow={false}
        />
      </ListItemView>
    </ListView>
  );
}

function MultiArgumentEditor({ content }: InternalArgumentEditorProps) {
  const dispatch = useDispatch();

  const childKeys = content.childKeys;
  const allContent = useSelector(selectContent);

  const [dragStartIndex, setDragStartIndex] = useState<number | undefined>();

  const [items, setItems] = useState<ExpressionEditorProps[]>([]);
  useEffect(() => {
    const updatedItems = childKeys.map((key) => {
      return {
        content: allContent[key] as FunctionContent | ReferenceContent | ValueContent,
        id: content.key,
        hideOverflow: false,
      };
    });
    setItems(updatedItems);
  }, [content, setItems, allContent, childKeys]);

  const handleStart = useCallback(
    (event: SortableEvent) => {
      if (event.oldIndex !== undefined) {
        setDragStartIndex(event.oldIndex);
      }
    },
    [setDragStartIndex],
  );

  const handleUpdate = useCallback(
    (event: SortableEvent) => {
      const startIndex = dragStartIndex;
      setDragStartIndex(undefined);
      if (event.newIndex !== undefined && startIndex !== undefined) {
        dispatch(reorderInput(content.key, startIndex, event.newIndex));
      }
    },
    [dragStartIndex, setDragStartIndex, content, dispatch],
  );

  const handleComplete = useCallback(() => {
    setDragStartIndex(undefined);
  }, [setDragStartIndex]);

  const handleAdd = useCallback(() => {
    dispatch(addInputValue(content.key));
  }, [content.key, dispatch]);

  const translate = useTranslate();
  const addButtonLabel = translate(labelKey('add-input'));

  return (
    <ListView key="list">
      <ReactSortable
        key="sortable"
        list={items}
        setList={setItems}
        onUpdate={handleUpdate}
        onStart={handleStart}
        onEnd={handleComplete}
        group={content.key}
        fallbackOnBody={false}
        emptyInsertThreshold={0}
        swapThreshold={0.5}
        animation={200}
        style={{ minHeight: '50px' }}
      >
        {items.map((props, index) => {
          const key = props.content.key;
          // Due to the way the DND library handles updates, it's possible a child has been removed
          //  but the items list has not yet been updated. Check each child to ensure it still
          //  exists
          return allContent.hasOwnProperty(key) ? (
            <ListItemView key={key}>
              <ExpressionEditor key={props.id} {...props} hideOverflow={index === dragStartIndex} />
            </ListItemView>
          ) : (
            <Box key="removed"></Box>
          );
        })}
      </ReactSortable>
      <ListItemView key={'add-button-item'} sx={{ px: 1 }}>
        <ListItemButton key={'button'} onClick={handleAdd}>
          <AddIcon key="icon" fontSize={'small'} sx={{ mr: 1 }} />
          <ListItemText key="text" primary={addButtonLabel} />
        </ListItemButton>
      </ListItemView>
    </ListView>
  );
}

export interface ExpressionEditorProps extends ItemInterface {
  content: FunctionContent | ReferenceContent | ValueContent;
  hideOverflow: boolean;
}

export function ExpressionEditor({ content, hideOverflow }: ExpressionEditorProps) {
  const dispatch = useDispatch();

  const selected = useSelector(selectIsInSelectedPath(content.key));

  const handleSelect = useCallback(() => {
    dispatch(setSelection(content.key));
  }, [content, dispatch]);

  const handleDelete = useCallback(() => {
    dispatch(deleteItem(content.key));
  }, [content, dispatch]);

  const additionalProps = { selected, handleSelect, handleDelete, hideOverflow };

  if (content.differentiator === ContentType.FUNCTION) {
    return <FunctionItemView content={content as FunctionContent} {...additionalProps} />;
  } else if (content.differentiator === ContentType.REFERENCE) {
    return <ReferenceItemView content={content as ReferenceContent} {...additionalProps} />;
  } else {
    return <ValueItemView content={content as ValueContent} {...additionalProps} />;
  }
}

interface ViewProps<TYPE extends Content> {
  content: TYPE;
  selected: boolean;
  handleSelect: () => void;
  handleDelete: () => void;
  hideOverflow: boolean;
}

function ValueItemView({ content, handleSelect, selected }: ViewProps<ValueContent>) {
  return (
    <ListItemButton selected={selected} onClick={handleSelect}>
      <ValueEditor contentKey={content.key} />
      <ContextActions contentKey={content.key} />
    </ListItemButton>
  );
}

function FunctionItemView({
  content,
  handleSelect,
  selected,
  hideOverflow,
}: ViewProps<FunctionContent>) {
  const translate = useTranslate();
  const functionName = content.name;

  const title = (
    <span>
      {translate(functionTitleKey(functionName))}&nbsp;
      <TypeView type={content.type} multi={content.multi} />
    </span>
  );
  const description = translate(functionDescriptionKey(functionName));

  return (
    <ListItemButton selected={selected} onClick={handleSelect}>
      <Stack direction={'column'} width={'100%'}>
        <ListItemButton
          disableRipple
          disableTouchRipple
          sx={{ p: 0, ':hover': { backgroundColor: 'inherit' } }}
        >
          <FunctionIcon sx={{ mr: 1 }} />
          <ListItemText primary={title} secondary={<span>{description}</span>} />
          <ContextActions contentKey={content.key} />
        </ListItemButton>
        {!hideOverflow && (
          <Box width={'100%'}>
            <SubTreeView contentKey={content.key} />
          </Box>
        )}
      </Stack>
    </ListItemButton>
  );
}

function ReferenceItemView({
  content,
  handleSelect,
  selected,
  hideOverflow,
}: ViewProps<ReferenceContent>) {
  const contentKey = content.key;
  const variableContent = useContent<VariableContent>(content.variableKey, ContentType.VARIABLE);
  const rootType = variableContent.type;
  const { types } = useSelector(selectEngineSpec);

  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const isTypeCompound = useMemo(() => {
    if (rootType.length !== 1) {
      // path selection is not allowed for intersection types
      return false;
    }
    const [typeId] = rootType;
    // A type is compound if it has child properties
    return Object.keys(types[typeId].properties).length > 0;
  }, [rootType, types]);

  const handleClick = useCallback(() => {
    handleSelect();
    if (isTypeCompound) {
      setOpen(true);
    }
  }, [handleSelect, isTypeCompound, setOpen]);

  return (
    <>
      <ListItemButton selected={selected} onClick={handleClick}>
        <Stack direction={'column'} width={'100%'}>
          <ListItemButton
            disableRipple
            disableTouchRipple
            sx={{ p: 0, ':hover': { backgroundColor: 'inherit' } }}
          >
            <ReferenceIcon />
            <ReferenceView contentKey={contentKey} />
            <ContextActions contentKey={contentKey} />
          </ListItemButton>
          {!hideOverflow && content.path.length > 0 && (
            <Box sx={{ ml: '30px', mt: '-6px' }}>
              <ReferencePathView contentKey={contentKey} />
            </Box>
          )}
        </Stack>
      </ListItemButton>
      <ReferencePathEditor {...{ contentKey, open }} onClose={handleClose} />
    </>
  );
}
