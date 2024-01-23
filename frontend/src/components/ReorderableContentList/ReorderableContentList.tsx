import { DragDropContext, Draggable, Droppable, OnDragEndResponder } from '@hello-pangea/dnd';
import { List, ListItem } from '@mui/material';
import React, { JSX } from 'react';

export interface ReorderableListProps {
  parentKey: string;
  onDragEnd: OnDragEndResponder;
  allowReorder: boolean;
  childKeys: string[];
  renderChildContent: (childKey: string) => JSX.Element;
  renderSecondaryAction: (childKey: string) => JSX.Element;
}

export function ReorderableContentList({
  parentKey,
  onDragEnd,
  allowReorder,
  childKeys,
  renderChildContent,
  renderSecondaryAction,
}: ReorderableListProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={parentKey} direction={'vertical'} isDropDisabled={!allowReorder}>
        {(droppableProvider) => (
          <List ref={droppableProvider.innerRef} {...droppableProvider.droppableProps}>
            {childKeys.map((childKey, index) => {
              const childContent = renderChildContent(childKey);
              const secondaryAction = renderSecondaryAction(childKey);

              return (
                <Draggable
                  key={childKey}
                  draggableId={childKey}
                  index={index}
                  isDragDisabled={!allowReorder}
                >
                  {(draggableProvider) => (
                    <ListItem
                      key={childKey}
                      disablePadding
                      divider={index !== childKeys.length - 1}
                      ref={draggableProvider.innerRef}
                      secondaryAction={secondaryAction}
                      {...draggableProvider.draggableProps}
                      {...draggableProvider.dragHandleProps}
                    >
                      {childContent}
                    </ListItem>
                  )}
                </Draggable>
              );
            })}
            {droppableProvider.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
}
