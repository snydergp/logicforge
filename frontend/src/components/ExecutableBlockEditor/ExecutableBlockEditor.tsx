import './ExecutableBlockEditor.scss';
import { useDispatch, useSelector } from 'react-redux';
import {
  addExecutable,
  deleteItem,
  moveExecutable,
  selectContentByKey,
  selectSelectedSubtree,
  setSelection,
} from '../../redux/slices/editors';
import {
  ActionContent,
  BlockContent,
  ConditionalContent,
  ContentType,
  VariableContent,
} from '../../types';
import React, {
  MouseEventHandler,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import { EditorContext, EditorInfo } from '../FrameEditor/FrameEditor';
import {
  actionDescriptionKey,
  actionTitleKey,
  controlBlockTitleKey,
  controlDescriptionKey,
  controlParameterTitleKey,
  controlTitleKey,
  labelKey,
} from '../../util';
import { ActionIcon, ConditionalIcon, ResultIcon } from '../Icons/Icons';
import { VariableDisplay } from '../VariableDisplay/VariableDisplay';
import { Search } from '@mui/icons-material';
import { ContextMenu, ContextMenuAction } from '../ContextMenu/ContentMenu';
import MenuIcon from '@mui/icons-material/Menu';

const DRAG_DROP_GROUP: string = 'executables';

const CONTROLS_GROUP_ID = 'controls';
const ACTIONS_GROUP_ID = 'actions';

type ExecutableSelector = (
  parentKey: string,
  name: string,
  type: ContentType.CONTROL | ContentType.ACTION,
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

  return <Block contentKey={contentKey} notifyStart={handleStart} notifyEnd={handleEnd} />;
}

interface BlockProps {
  contentKey: string;
  notifyStart: (key: string) => void;
  notifyEnd: (parentKey: string, newIndex: number) => void;
}

function Block({ contentKey, notifyStart, notifyEnd }: BlockProps) {
  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined) {
    throw new Error(`Missing content: ${contentKey}`);
  }
  if (content.type !== ContentType.BLOCK) {
    throw new Error(`Unexpected content type: ${content.type}`);
  }
  const blockContent = content as BlockContent;

  const [items, setItems] = useState<ExecutableProps[]>([]);
  useEffect(() => {
    const items = blockContent.childKeys.map((contentKey) => {
      return {
        contentKey,
        id: contentKey,
        notifyStart,
        notifyEnd,
      };
    });
    setItems(items);
  }, [blockContent.childKeys, setItems]);

  const handleStart = useCallback(
    (event: SortableEvent) => {
      console.info(`Start Drag from parent ${contentKey}, index ${event.oldIndex}`);
      if (event.oldIndex !== undefined) {
        const draggedItem = items[event.oldIndex];
        console.info(`Dragging ${draggedItem.contentKey}`);
        notifyStart(draggedItem.contentKey);
      }
    },
    [notifyStart, items],
  );

  const handleEnd = useCallback(
    (event: SortableEvent) => {
      if (event.newIndex !== undefined) {
        console.info(`End Drag to parent ${contentKey}, index ${event.newIndex}`);
        notifyEnd(contentKey, event.newIndex);
      }
    },
    [notifyEnd],
  );

  return (
    <List
      dense
      disablePadding
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default,
        py: 1,
        m: 1,
      })}
    >
      <ReactSortable
        list={items}
        setList={setItems}
        onAdd={handleEnd}
        onStart={handleStart}
        group={DRAG_DROP_GROUP}
        fallbackOnBody={true}
        emptyInsertThreshold={0}
        swapThreshold={0.75}
        dragClass={'ExecutableBlockEditor__Item--dragGhost'}
        ghostClass={'ExecutableBlockEditor__Item--dragGhost'}
        animation={200}
        style={{ minHeight: '50px' }}
      >
        {items.map((item) => (
          <Executable
            key={item.contentKey}
            contentKey={item.contentKey}
            id={item.contentKey}
            notifyStart={notifyStart}
            notifyEnd={notifyEnd}
          />
        ))}
      </ReactSortable>
      <ExecutablePlaceholder parentKey={contentKey} />
    </List>
  );
}

interface ExecutableProps extends ItemInterface {
  contentKey: string;
  notifyStart: (key: string) => void;
  notifyEnd: (parentKey: string, newIndex: number) => void;
}

function Executable({ contentKey, notifyStart, notifyEnd }: ExecutableProps) {
  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined) {
    // Due to the way the DND lib handles updates, a render is still attempted after an executable
    // is deleted. To prevent an error in this scenario, returning an empty node
    return <></>;
  }
  if (content.type !== ContentType.ACTION && content.type !== ContentType.CONTROL) {
    throw new Error(`Unexpected content type: ${content.type}`);
  }
  return (
    <ListItem key={contentKey}>
      {content.type === ContentType.ACTION ? (
        <ActionItem content={content as ActionContent} />
      ) : (
        <ConditionalItem
          content={content as ConditionalContent}
          notifyStart={notifyStart}
          notifyEnd={notifyEnd}
        />
      )}
    </ListItem>
  );
}

interface ActionItemProps {
  content: ActionContent;
}

function ActionItem({ content }: ActionItemProps) {
  const translate = useTranslate();
  const dispatch = useDispatch();
  const { engineSpec } = useContext(EditorContext) as EditorInfo;
  const selection = useSelector(selectSelectedSubtree);
  const selected = selection !== undefined && selection.indexOf(content) >= 0;
  const actionName = content.name;
  const actionSpec = engineSpec.actions[actionName];
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
            <ContextMenuButton contentKey={content.key} />
          </Stack>
          {content.variableContentKey !== undefined && (
            <Box width={'100%'} className={'ExecutableBlockEditor__ItemAdditionalContent'}>
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
  notifyStart: (key: string) => void;
  notifyEnd: (parentKey: string, newIndex: number) => void;
}

function ConditionalItem({ content, notifyStart, notifyEnd }: ConditionalItemProps) {
  const translate = useTranslate();
  const dispatch = useDispatch();

  const handleClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    (e) => {
      dispatch(setSelection(content.key));
      e.stopPropagation();
    },
    [dispatch, content],
  );

  const ifTitle = translate(controlParameterTitleKey('conditional', 'condition'));
  const thenTitle = translate(controlBlockTitleKey('conditional', 'then'));
  const elseTitle = translate(controlBlockTitleKey('conditional', 'else'));

  const thenChildKey = content.childKeys[0];
  const elseChildKey = content.childKeys[1];

  const subheaderStyle: SxProps<Theme> = {
    fontWeight: '900',
  };

  return (
    <ExecutableWrapper>
      <ListItemButton onClick={handleClick}>
        <Stack direction={'column'}>
          <Stack direction={'row'} sx={{ mt: 1 }}>
            <ConditionalIcon sx={{ mr: 1 }} style={{ transform: 'rotate(90deg)' }} />
            <ListItemText primary={`Conditional ${content.key}`} secondary={<span>&nbsp;</span>} />
            <ContextMenuButton contentKey={content.key} />
          </Stack>
          <Box
            sx={{ pl: 2.5 }}
            width={'100%'}
            className={'ExecutableBlockEditor__ItemAdditionalContent'}
          >
            <Box width={'100%'}>
              <Typography sx={subheaderStyle}>{ifTitle}</Typography>
              <Button fullWidth>{translate(labelKey('conditional-click-to-edit'))}</Button>
            </Box>
            <Box width={'100%'}>
              <Typography sx={subheaderStyle}>{thenTitle}</Typography>
              <Block contentKey={thenChildKey} notifyStart={notifyStart} notifyEnd={notifyEnd} />
            </Box>
            <Box width={'100%'}>
              <Typography sx={subheaderStyle}>{elseTitle}</Typography>
              <Block contentKey={elseChildKey} notifyStart={notifyStart} notifyEnd={notifyEnd} />
            </Box>
          </Box>
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
  if (content === undefined || content.type !== ContentType.VARIABLE) {
    return null;
  }
  const variableContent = content as VariableContent;
  return (
    <VariableDisplay
      typeId={variableContent.typeId as string}
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
    <ListItem>
      <ExecutableWrapper>
        <ListItemButton selected={false} onClick={handleOpen}>
          <ListItemText primary={placeholderLabel} />
        </ListItemButton>
        <ExecutableSelectionDialog parentKey={parentKey} open={open} cancel={handleCancel} />
      </ExecutableWrapper>
    </ListItem>
  );
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

  const { engineSpec } = useContext(EditorContext) as EditorInfo;
  const controls = engineSpec.controls;
  const actions = Object.keys(engineSpec.actions);

  const controlItems = useMemo(
    () =>
      controls.map((control) => {
        return {
          group: CONTROLS_GROUP_ID,
          name: control,
          title: translate(controlTitleKey(control)),
          description: translate(controlDescriptionKey(control)),
        } as ExecutableItem;
      }),
    [controls],
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
    [actions],
  );

  const allItems = [...controlItems, ...actionItems];
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
    (parentKey: string, name: string, type: ContentType.CONTROL | ContentType.ACTION) => {
      dispatch(addExecutable(parentKey, name, type));
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
