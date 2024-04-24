import { useDispatch, useSelector } from 'react-redux';
import {
  addExecutable,
  moveExecutable,
  selectContentByKey,
  selectEngineSpec,
  selectIsInSelectedPath,
  setSelection,
} from '../../redux/slices/editors';
import {
  ActionContent,
  BlockContent,
  CONDITIONAL_CONDITION_PROP,
  ConditionalContent,
  ContentType,
  ControlType,
  VariableContent,
} from '../../types';
import React, { MouseEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import { ItemInterface, ReactSortable, SortableEvent } from 'react-sortablejs';
import {
  Box,
  Button,
  darken,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Input,
  InputAdornment,
  lighten,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  styled,
  SxProps,
  Theme,
  Typography,
} from '@mui/material';
import { useTranslate } from '../I18n/I18n';
import {
  actionDescriptionKey,
  actionTitleKey,
  controlBlockTitleKey,
  controlDescriptionKey,
  controlParameterTitleKey,
  controlTitleKey,
  labelKey,
} from '../../util';
import { ActionIcon, AddIcon, ConditionalIcon, ResultIcon } from '../Icons/Icons';
import { VariableView } from '../VariableView/VariableView';
import { Search } from '@mui/icons-material';
import { ArgumentEditor } from '../ArgumentEditor/ArgumentEditor';
import { ContextActions } from '../ContextActions/ContextActions';

const DRAG_DROP_GROUP: string = 'executables';

const CONTROLS_GROUP_ID = 'controls';
const ACTIONS_GROUP_ID = 'actions';

type ExecutableSelector = (
  parentKey: string,
  name: string,
  differentiator: ContentType.CONTROL | ContentType.ACTION,
) => void;

export interface ExecutableBlockEditorProps {
  contentKey: string;
}

export function ExecutableBlockEditor({ contentKey }: ExecutableBlockEditorProps) {
  const [draggedItemKey, setDraggedItemKey] = useState<string | undefined>();
  const dispatch = useDispatch();

  const handleStart = useCallback(
    (key: string) => {
      setDraggedItemKey(key);
    },
    [setDraggedItemKey],
  );

  const handleEnd = useCallback(
    (parentKey: string, newIndex: number) => {
      if (draggedItemKey !== undefined) {
        dispatch(moveExecutable(draggedItemKey, parentKey, newIndex));
        setDraggedItemKey(undefined);
      }
    },
    [draggedItemKey, setDraggedItemKey, dispatch],
  );

  const handleComplete = useCallback(() => {
    if (draggedItemKey !== undefined) {
      setDraggedItemKey(undefined);
    }
  }, [draggedItemKey, setDraggedItemKey]);

  const handlers: Handlers = useMemo(
    () => ({
      notifyStart: handleStart,
      notifyEnd: handleEnd,
      notifyComplete: handleComplete,
    }),
    [handleStart, handleEnd, handleComplete],
  );

  return (
    <Block
      {...{
        contentKey,
        draggedItemKey,
        handlers,
      }}
    />
  );
}

interface Handlers {
  notifyStart: (key: string) => void;
  notifyEnd: (parentKey: string, newIndex: number) => void;
  notifyComplete: () => void;
}

interface BlockProps {
  contentKey: string;
  handlers: Handlers;
  draggedItemKey: string | undefined;
}

function Block({ contentKey, handlers, draggedItemKey }: BlockProps) {
  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined) {
    throw new Error(`Missing content: ${contentKey}`);
  }
  if (content.differentiator !== ContentType.BLOCK) {
    throw new Error(`Unexpected content type: ${content.differentiator}`);
  }
  const blockContent = content as BlockContent;

  const [items, setItems] = useState<ExecutableProps[]>([]);
  useEffect(() => {
    const items = blockContent.childKeys.map((contentKey) => {
      return {
        contentKey,
        id: contentKey,
        handlers,
        draggedItemKey,
      };
    });
    setItems(items);
  }, [blockContent.childKeys, setItems, handlers, draggedItemKey]);

  const handleStart = useCallback(
    (event: SortableEvent) => {
      if (event.oldIndex !== undefined) {
        const draggedItem = items[event.oldIndex];
        handlers.notifyStart(draggedItem.contentKey);
      }
    },
    [handlers, items],
  );

  const handleEnd = useCallback(
    (event: SortableEvent) => {
      if (event.newIndex !== undefined) {
        handlers.notifyEnd(contentKey, event.newIndex);
      }
    },
    [handlers, contentKey],
  );

  const handleComplete = useCallback(
    (event: SortableEvent) => {
      handlers.notifyComplete();
    },
    [handlers],
  );

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
        onUpdate={handleEnd}
        onStart={handleStart}
        onEnd={handleComplete}
        group={DRAG_DROP_GROUP}
        fallbackOnBody={true}
        emptyInsertThreshold={0}
        swapThreshold={0.75}
        animation={200}
        style={{ minHeight: '50px' }}
      >
        {items.map((item) => (
          <Executable
            key={item.contentKey}
            contentKey={item.contentKey}
            id={item.contentKey}
            handlers={handlers}
            draggedItemKey={draggedItemKey}
          />
        ))}
      </ReactSortable>
      <ExecutablePlaceholder parentKey={contentKey} />
    </List>
  );
}

interface ExecutableProps extends ItemInterface {
  contentKey: string;
  handlers: Handlers;
  draggedItemKey: string | undefined;
}

function Executable({ contentKey, handlers, draggedItemKey }: ExecutableProps) {
  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined) {
    // Due to the way the DND lib handles updates, a render is still attempted after an executable
    // is deleted. To prevent an error in this scenario, returning an empty node
    return <></>;
  }
  if (
    content.differentiator !== ContentType.ACTION &&
    content.differentiator !== ContentType.CONTROL
  ) {
    throw new Error(`Unexpected content type: ${content.differentiator}`);
  }
  return (
    <ListItem key={contentKey} sx={{ px: 1 }}>
      {content.differentiator === ContentType.ACTION ? (
        <ActionItem content={content as ActionContent} draggedItemKey={draggedItemKey} />
      ) : (
        <ConditionalItem
          content={content as ConditionalContent}
          handlers={handlers}
          draggedItemKey={draggedItemKey}
        />
      )}
    </ListItem>
  );
}

interface ActionItemProps {
  content: ActionContent;
  draggedItemKey: string | undefined;
}

function ActionItem({ content, draggedItemKey }: ActionItemProps) {
  const translate = useTranslate();
  const dispatch = useDispatch();
  const selected = useSelector(selectIsInSelectedPath(content.key));
  const actionName = content.name;
  const title = translate(actionTitleKey(actionName));
  const description = translate(actionDescriptionKey(actionName));

  const handleSelect = useCallback<MouseEventHandler<HTMLDivElement>>(
    (e) => {
      dispatch(setSelection(content.key));
      e.stopPropagation(); // buttons are nested: prevent click on parent
    },
    [dispatch, content],
  );

  return (
    <ExecutableWrapper>
      <ListItemButton onClick={handleSelect} selected={selected}>
        <Stack direction={'column'} width={'100%'}>
          <Stack direction={'row'} sx={{ mt: 1 }} width={'100%'}>
            <ActionIcon sx={{ mr: 1, mt: 1 }} />
            <ListItemText
              primary={title + ' ' + content.key}
              secondary={<span>{description}</span>}
            />
            <ContextActions contentKey={content.key} />
          </Stack>
          {content.variableContentKey !== undefined && draggedItemKey !== content.key && (
            <Box width={'100%'}>
              <Box textAlign={'center'} width={'100%'}>
                <ResultIcon />
              </Box>
              <VariableDisplayWrapper contentKey={content.variableContentKey} />
            </Box>
          )}
        </Stack>
      </ListItemButton>
    </ExecutableWrapper>
  );
}

interface ConditionalItemProps {
  content: ConditionalContent;
  handlers: Handlers;
  draggedItemKey: string | undefined;
}

function ConditionalItem({ content, handlers, draggedItemKey }: ConditionalItemProps) {
  const translate = useTranslate();
  const dispatch = useDispatch();

  const handleClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    (e) => {
      dispatch(setSelection(content.key));
      e.stopPropagation();
    },
    [dispatch, content],
  );

  const ifTitle = translate(controlParameterTitleKey(ControlType.CONDITIONAL, 'condition'));
  const thenTitle = translate(controlBlockTitleKey(ControlType.CONDITIONAL, 'then'));
  const elseTitle = translate(controlBlockTitleKey(ControlType.CONDITIONAL, 'else'));

  const thenChildKey = content.childKeys[0];
  const elseChildKey = content.childKeys[1];

  const subheaderStyle: SxProps<Theme> = {
    fontWeight: '900',
  };

  return (
    <ExecutableWrapper>
      <ListItemButton onClick={handleClick}>
        <Stack direction={'column'} width={'100%'}>
          <ListItemButton
            disableRipple
            disableTouchRipple
            sx={{ p: 0, ':hover': { backgroundColor: 'inherit' } }}
          >
            <ConditionalIcon sx={{ mr: 1 }} style={{ transform: 'rotate(90deg)' }} />
            <ListItemText primary={`Conditional ${content.key}`} secondary={<span>&nbsp;</span>} />
            <ContextActions contentKey={content.key} />
          </ListItemButton>
          {draggedItemKey !== content.key && (
            <Box sx={{ pl: 2.5 }} width={'100%'}>
              <Box width={'100%'}>
                <Typography sx={subheaderStyle}>{ifTitle}</Typography>
                <ArgumentEditor contentKey={content.childKeyMap[CONDITIONAL_CONDITION_PROP]} />
              </Box>
              <Box width={'100%'}>
                <Typography sx={subheaderStyle}>{thenTitle}</Typography>
                <Block
                  contentKey={thenChildKey}
                  handlers={handlers}
                  draggedItemKey={draggedItemKey}
                />
              </Box>
              <Box width={'100%'}>
                <Typography sx={subheaderStyle}>{elseTitle}</Typography>
                <Block
                  contentKey={elseChildKey}
                  handlers={handlers}
                  draggedItemKey={draggedItemKey}
                />
              </Box>
            </Box>
          )}
        </Stack>
      </ListItemButton>
    </ExecutableWrapper>
  );
}

interface VariableDisplayWrapperProps {
  contentKey: string;
}

function VariableDisplayWrapper({ contentKey }: VariableDisplayWrapperProps) {
  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined || content.differentiator !== ContentType.VARIABLE) {
    return null;
  }
  const variableContent = content as VariableContent;
  return (
    <VariableView
      type={variableContent.type}
      multi={variableContent.multi}
      optional={false}
      title={variableContent.title}
      description={variableContent.description}
    />
  );
}

interface ExecutablePlaceholderProps {
  parentKey: string;
}

function ExecutablePlaceholder({ parentKey }: ExecutablePlaceholderProps) {
  const translate = useTranslate();
  const placeholderLabel = translate(labelKey('new-executable'));

  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // TODO click action

  return (
    <ListItem sx={{ px: 1 }}>
      <ExecutableWrapper>
        <ListItemButton selected={false} onClick={handleOpen}>
          <AddIcon fontSize={'small'} sx={{ mr: 1 }} />
          <ListItemText primary={placeholderLabel} />
        </ListItemButton>
        <ExecutableSelectionDialog parentKey={parentKey} open={open} cancel={handleCancel} />
      </ExecutableWrapper>
    </ListItem>
  );
}

interface ExecutableSelectionDialogProps {
  parentKey: string;
  open: boolean;
  cancel: () => void;
}

type ExecutableItem = {
  group: string;
  name: string;
  title: string;
  description: string;
};

function ExecutableSelectionDialog(props: ExecutableSelectionDialogProps) {
  const { parentKey, open, cancel } = props;
  const translate = useTranslate();
  let dispatch = useDispatch();

  const engineSpec = useSelector(selectEngineSpec);
  const controls = engineSpec.controls;
  const actions = Object.keys(engineSpec.actions);

  const controlItems = useMemo(
    () =>
      controls.map((control) => {
        return {
          group: CONTROLS_GROUP_ID,
          name: control,
          title: translate(controlTitleKey(control as string)),
          description: translate(controlDescriptionKey(control as string)),
        } as ExecutableItem;
      }),
    [controls, translate],
  );

  const actionItems = useMemo(
    () =>
      actions.map((action) => {
        return {
          group: ACTIONS_GROUP_ID,
          name: action,
          title: translate(actionTitleKey(action)),
          description: translate(actionDescriptionKey(action)),
        } as ExecutableItem;
      }),
    [actions, translate],
  );

  const allItems = useMemo(() => [...controlItems, ...actionItems], [controlItems, actionItems]);
  allItems.sort((a, b) => {
    return b.name.localeCompare(a.name) || a.title.localeCompare(b.title);
  });

  const [searchText, setSearchText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = useMemo(() => {
    const filtered: ExecutableItem[] = [];
    allItems.forEach((item) => {
      if (matches(searchText, item)) {
        filtered.push(item);
      }
    });
    return filtered;
  }, [searchText, allItems]);

  const handleSearchTextUpdate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.target.value);
    },
    [setSearchText],
  );

  const handleSelection: ExecutableSelector = useCallback(
    (parentKey: string, name: string, differentiator: ContentType.CONTROL | ContentType.ACTION) => {
      dispatch(addExecutable(parentKey, name, differentiator));
    },
    [dispatch],
  );

  const handleSelect = useCallback(() => {
    let executableItem = filteredItems[selectedIndex];
    handleSelection(
      parentKey,
      executableItem.name,
      executableItem.group === CONTROLS_GROUP_ID ? ContentType.CONTROL : ContentType.ACTION,
    );
    cancel();
  }, [parentKey, selectedIndex, filteredItems, handleSelection, cancel]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.code) {
        case 'ArrowUp':
          setSelectedIndex(Math.max(selectedIndex - 1, 0));
          break;
        case 'ArrowDown':
          setSelectedIndex(Math.min(selectedIndex + 1, filteredItems.length - 1));
          break;
        case 'Enter':
          handleSelect();
          break;
      }
    },
    [selectedIndex, setSelectedIndex, filteredItems, handleSelect],
  );

  return (
    <Dialog open={open} title={'Add Action'} sx={{ p: 2 }}>
      <DialogTitle>Add Action</DialogTitle>
      <Stack>
        <Input
          placeholder={'Filter'}
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
        {renderGroupedList(filteredItems, selectedIndex, setSelectedIndex)}
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

function renderGroupedList(
  items: ExecutableItem[],
  selectedIndex: number,
  setSelectedIndex: (index: number) => void,
) {
  if (items.length === 0) {
    return null;
  }
  const actionIndex = items.findIndex((item) => item.group);
  return (
    <List sx={{ mt: 1, minWidth: '400px', minHeight: '500px' }}>
      {actionIndex > 0 && <Typography key={CONTROLS_GROUP_ID}>Controls</Typography>}
      {actionIndex > 0 &&
        items.slice(0, actionIndex).map((item, index) => {
          return (
            <ListItem key={`${item.group}-${item.name}`}>
              <ListItemButton
                onClick={() => setSelectedIndex(index)}
                selected={index === selectedIndex}
              >
                <ListItemText secondary={<span>{item.description}</span>}>
                  {item.title}
                </ListItemText>
              </ListItemButton>
            </ListItem>
          );
        })}
      {actionIndex >= 0 && <Typography key={ACTIONS_GROUP_ID}>Actions</Typography>}
      {actionIndex >= 0 &&
        items.slice(actionIndex).map((item, index) => {
          return (
            <ListItem key={`${item.group}-${item.name}`}>
              <ListItemButton
                onClick={() => setSelectedIndex(index + actionIndex)}
                selected={index + actionIndex === selectedIndex}
              >
                <ListItemText secondary={<span>{item.description}</span>}>
                  {item.title}
                </ListItemText>
              </ListItemButton>
            </ListItem>
          );
        })}
    </List>
  );
}

function matches(searchString: string, item: ExecutableItem): boolean {
  const searchStringUppercase = searchString.toUpperCase();
  return (
    item.name.toUpperCase().includes(searchStringUppercase) ||
    item.title.toUpperCase().includes(searchStringUppercase) ||
    item.description.toUpperCase().includes(searchStringUppercase)
  );
}

const ExecutableWrapper = styled('div')(({ theme }) => ({
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
