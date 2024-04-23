import {
  ArgumentContent,
  Content,
  ContentKey,
  ContentType,
  FunctionContent,
  ReferenceContent,
  ValueContent,
} from '../../types';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslate } from '../I18n/I18n';
import {
  addInputValue,
  deleteItem,
  reorderInput,
  selectContent,
  selectIsInSelectedPath,
  selectParameterSpecificationForKey,
  setSelection,
} from '../../redux/slices/editors';
import { useContent } from '../../hooks/useContent';
import React, { useCallback, useEffect, useState } from 'react';
import List from '@mui/material/List';
import { ValueEditor } from '../ValueEditor/ValueEditor';
import {
  Box,
  darken,
  lighten,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  styled,
} from '@mui/material';
import { AddIcon, FunctionIcon, ReferenceIcon } from '../Icons/Icons';
import { functionDescriptionKey, functionTitleKey, labelKey } from '../../util';
import { ItemInterface, ReactSortable, SortableEvent } from 'react-sortablejs';
import { RefEditor } from '../RefEditor/RefEditor';
import { SubTreeView } from '../SubTreeView/SubTreeView';

import { ContextActions } from '../ContextActions/ContextActions';

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
    <List
      dense
      disablePadding
      sx={(theme) => ({
        backgroundColor:
          theme.palette.mode === 'light'
            ? lighten(theme.palette.background.default, 0.1)
            : darken(theme.palette.background.default, 0.1),
        py: 0.5,
        m: 1,
      })}
    >
      <ListItem sx={{ px: 1 }} key={childKey}>
        <ItemWrapper>
          <ExpressionEditor content={childContent} id={childKey} hideOverflow={false} />
        </ItemWrapper>
      </ListItem>
    </List>
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
    <List
      dense
      disablePadding
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default,
        py: 0.5,
        m: 1,
      })}
    >
      <ReactSortable
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
            <ListItem key={key} sx={{ px: 1 }}>
              <ItemWrapper>
                <ExpressionEditor {...props} hideOverflow={index === dragStartIndex} />
              </ItemWrapper>
            </ListItem>
          ) : (
            <></>
          );
        })}
      </ReactSortable>
      <ListItem key={'add-button'} sx={{ px: 1 }}>
        <ItemWrapper>
          <ListItemButton onClick={handleAdd}>
            <AddIcon fontSize={'small'} sx={{ mr: 1 }} />
            <ListItemText primary={addButtonLabel} />
          </ListItemButton>
        </ItemWrapper>
      </ListItem>
    </List>
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

  if (content.type === ContentType.FUNCTION) {
    return <FunctionItemView content={content as FunctionContent} {...additionalProps} />;
  } else if (content.type === ContentType.REFERENCE) {
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

  const title = translate(functionTitleKey(functionName));
  const description = translate(functionDescriptionKey(functionName));

  return (
    <ListItemButton selected={selected} onClick={handleSelect}>
      <Stack direction={'column'}>
        <ListItemButton
          disableRipple
          disableTouchRipple
          sx={{ ':hover': { backgroundColor: 'inherit' } }}
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

function ReferenceItemView({ content, handleSelect, selected }: ViewProps<ReferenceContent>) {
  return (
    <ListItemButton selected={selected} onClick={handleSelect}>
      <ReferenceIcon />
      <RefEditor contentKey={content.key} />
      <ContextActions contentKey={content.key} />
    </ListItemButton>
  );
}

const ItemWrapper = styled('div')(({ theme }) => ({
  minWidth: '220px',
  width: '100%',
  backgroundColor:
    theme.palette.mode === 'light'
      ? darken(theme.palette.background.paper, 0.1)
      : lighten(theme.palette.background.paper, 0.1),
  border: '1px solid',
  borderColor:
    theme.palette.mode === 'light'
      ? darken(theme.palette.background.paper, 0.15)
      : lighten(theme.palette.background.paper, 0.15),
}));
