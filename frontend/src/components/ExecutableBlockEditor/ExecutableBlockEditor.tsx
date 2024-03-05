import { useDispatch, useSelector } from 'react-redux';
import {
  addExecutable,
  selectContentByKey,
  selectSelectedSubtree,
} from '../../redux/slices/editors';
import {
  ActionContent,
  BlockContent,
  ConditionalContent,
  ContentType,
  ControlContent,
  ControlType,
  isExecutable,
  VariableContent,
} from '../../types';
import {
  DragDropContext,
  Draggable,
  DragStart,
  Droppable,
  DroppableProvided,
  DropResult,
  OnDragEndResponder,
  OnDragStartResponder,
  ResponderProvided,
} from '@hello-pangea/dnd';
import {
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
  Stack,
  Typography,
} from '@mui/material';
import { useTranslate } from 'react-polyglot';
import {
  actionDescriptionPath,
  actionTitlePath,
  controlBlockTitle,
  controlDescription,
  controlTitle,
  label,
} from '../../util';
import { ActionIcon } from '../Icons/Icons';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Search } from '@mui/icons-material';
import { EditorContext, EditorInfo } from '../FrameEditor/FrameEditor';
import { VariableDisplay } from '../VariableDisplay/VariableDisplay';

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

type ExecutableTreeInfo = {
  activeDrag: boolean;
  handleSelection: ExecutableSelector;
};

const ExecutableTreeContext = React.createContext<ExecutableTreeInfo>({
  activeDrag: false,
  handleSelection: () => null,
});

export function ExecutableBlockEditor({ contentKey }: ExecutableBlockEditorProps) {
  let dispatch = useDispatch();
  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined || content.type !== ContentType.BLOCK) {
    return null;
  }

  const handleSelection = useCallback(
    (parentKey: string, name: string, type: ContentType.CONTROL | ContentType.ACTION) => {
      dispatch(addExecutable(parentKey, name, type));
    },
    [dispatch],
  );

  const [context, setContext] = useState({
    activeDrag: false,
    handleSelection,
  } as ExecutableTreeInfo);

  const handleDragStart = useCallback(
    (start: DragStart, provided: ResponderProvided) => {
      setContext({
        activeDrag: true,
        handleSelection,
      });
      // TODO
    },
    [setContext],
  );
  const handleDragEnd = useCallback(
    (result: DropResult, provided: ResponderProvided) => {
      setContext({
        activeDrag: false,
        handleSelection,
      });
      // TODO
    },
    [setContext],
  );

  return (
    <ExecutableTreeContext.Provider value={context}>
      <RootDragDropContext
        contentKey={contentKey}
        handleDragEnd={handleDragEnd}
        handleDragStart={handleDragStart}
      />
    </ExecutableTreeContext.Provider>
  );
}

interface RootDragDropContextProps {
  contentKey: string;
  handleDragEnd: OnDragEndResponder;
  handleDragStart: OnDragStartResponder;
}

function RootDragDropContext({ contentKey, handleDragEnd }: RootDragDropContextProps) {
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <BlockDroppable contentKey={contentKey} />
      <ExecutablePlaceholder parentKey={contentKey} />
    </DragDropContext>
  );
}

interface BlockDroppableProps {
  contentKey: string;
}

function BlockDroppable({ contentKey }: BlockDroppableProps) {
  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined || content.type !== ContentType.BLOCK) {
    return null;
  }

  return (
    <Droppable droppableId={'actions'} direction={'vertical'} isDropDisabled={false}>
      {(droppableProvided: DroppableProvided) => {
        return (
          <List ref={droppableProvided.innerRef}>
            {(content as BlockContent).childKeys.map((childKey, index) => {
              return <ExecutableContentWrapper contentKey={childKey} index={index} />;
            })}
          </List>
        );
      }}
    </Droppable>
  );
}

interface ExecutableContentWrapperProps {
  contentKey: string;
  index: number;
}

function ExecutableContentWrapper({ contentKey, index }: ExecutableContentWrapperProps) {
  const content = useSelector(selectContentByKey(contentKey));
  if (content !== undefined) {
    if (isExecutable(content.type)) {
      return (
        <Draggable key={contentKey} draggableId={contentKey} index={index}>
          {(draggableProvided) => {
            return (
              <ListItem
                ref={draggableProvided.innerRef}
                {...draggableProvided.draggableProps}
                {...draggableProvided.dragHandleProps}
              >
                {content.type === ContentType.ACTION ? (
                  <ActionItem content={content as ActionContent} />
                ) : content.type === ContentType.CONTROL &&
                  (content as ControlContent).controlType === ControlType.CONDITIONAL ? (
                  <ConditionalItem content={content as ConditionalContent} />
                ) : null}
              </ListItem>
            );
          }}
        </Draggable>
      );
    }
  }
  return null;
}

interface ActionItemProps {
  content: ActionContent;
}

function ActionItem({ content }: ActionItemProps) {
  const { engineSpec } = useContext(EditorContext) as EditorInfo;
  const selection = useSelector(selectSelectedSubtree);
  const selected = selection !== undefined && selection.indexOf(content) >= 0;
  const translate = useTranslate();
  const actionName = content.name;
  const actionSpec = engineSpec.actions[actionName];
  const title = translate(actionTitlePath(actionName));
  const description = translate(actionDescriptionPath(actionName));

  return (
    <ListItemButton selected={selected}>
      <ActionIcon sx={{ mr: 1 }} />
      <ListItemText primary={title} secondary={<span>{description}</span>} />
      {content.variableContentKey !== undefined && actionSpec.outputType !== undefined && (
        <VariableDisplayWrapper
          contentKey={content.variableContentKey}
          typeId={actionSpec.outputType}
        />
      )}
    </ListItemButton>
  );
}

interface ConditionalItemProps {
  content: ConditionalContent;
}

function ConditionalItem({ content }: ConditionalItemProps) {
  const selection = useSelector(selectSelectedSubtree);
  const selected = selection !== undefined && selection.indexOf(content) >= 0;
  const translate = useTranslate();
  const thenTitle = translate(controlBlockTitle('conditional', 'then'));
  const elseTitle = translate(controlBlockTitle('conditional', 'else'));

  const thenChildKey = content.childKeys[0];
  const elseChildKey = content.childKeys[1];

  return (
    <ListItemButton selected={selected}>
      <Container sx={{ pr: 1 }}>
        <Container>
          <Typography>{thenTitle}</Typography>
          <BlockDroppable contentKey={thenChildKey} />
        </Container>
        <Container>
          <Typography>{elseTitle}</Typography>
          <BlockDroppable contentKey={elseChildKey} />
        </Container>
      </Container>
    </ListItemButton>
  );
}

interface ExecutablePlaceholderProps {
  parentKey: string;
}

function ExecutablePlaceholder({ parentKey }: ExecutablePlaceholderProps) {
  const { activeDrag, handleSelection } = useContext(ExecutableTreeContext);
  const translate = useTranslate();
  const placeholderLabel = translate(label('new-executable'));

  const [open, setOpen] = useState(false);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // TODO click action

  return (
    <ListItemButton selected={false} disabled={activeDrag}>
      <ListItemText primary={placeholderLabel} />
      <ExecutableSelectionDialog
        parentKey={parentKey}
        open={open}
        cancel={handleCancel}
        handleSelection={handleSelection}
      />
    </ListItemButton>
  );
}

interface ExecutableSelectionDialogProps {
  parentKey: string;
  open: boolean;
  cancel: () => void;
  handleSelection: ExecutableSelector;
}

type ExecutableItem = {
  group: string;
  name: string;
  title: string;
  description: string;
};

function ExecutableSelectionDialog({
  parentKey,
  open,
  cancel,
  handleSelection,
}: ExecutableSelectionDialogProps) {
  const translate = useTranslate();

  const { engineSpec } = useContext(EditorContext) as EditorInfo;
  const controls = engineSpec.controls;
  const actions = Object.keys(engineSpec.actions);

  const controlItems = useMemo(
    () =>
      controls.map((control) => {
        return {
          group: CONTROLS_GROUP_ID,
          name: control,
          title: translate(controlTitle(control)),
          description: translate(controlDescription(control)),
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
          title: translate(actionTitlePath(action)),
          description: translate(actionDescriptionPath(action)),
        } as ExecutableItem;
      }),
    [actions],
  );

  const allItems = [...controlItems, ...actionItems];
  allItems.sort((a, b) => {
    return b.name.localeCompare(a.name) || a.title.localeCompare(b.title);
  });

  const [searchText, setSearchText] = useState('');
  const [filteredItems, setFilteredItems] = useState(allItems);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSearchTextUpdate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.target.value);
    },
    [setSearchText],
  );

  const handleSelect = useCallback(() => {
    let executableItem = filteredItems[selectedIndex];
    handleSelection(
      parentKey,
      executableItem.name,
      executableItem.group === CONTROLS_GROUP_ID ? ContentType.CONTROL : ContentType.ACTION,
    );
  }, [parentKey, handleSelection, selectedIndex, filteredItems]);

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

  useEffect(() => {
    setSelectedIndex(0);
    const filtered: ExecutableItem[] = [];
    allItems.forEach((item) => {
      if (matches(searchText, item)) {
        filtered.push(item);
      }
    });
    setFilteredItems(filtered);
  }, [searchText, allItems, setSelectedIndex, filteredItems, setFilteredItems]);

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

interface VariableDisplayWrapperProps {
  contentKey: string;
  typeId: string;
}

function VariableDisplayWrapper({ contentKey, typeId }: VariableDisplayWrapperProps) {
  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined || content.type !== ContentType.VARIABLE) {
    return null;
  }
  const variableContent = content as VariableContent;
  return (
    <VariableDisplay
      typeId={typeId}
      optional={false}
      title={variableContent.title}
      description={variableContent.description}
    />
  );
}
