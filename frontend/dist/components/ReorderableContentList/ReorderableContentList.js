import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { List, ListItem } from '@mui/material';
export function ReorderableContentList({ parentKey, onDragEnd, allowReorder, childKeys, renderChildContent, renderSecondaryAction, }) {
    return (_jsx(DragDropContext, Object.assign({ onDragEnd: onDragEnd }, { children: _jsx(Droppable, Object.assign({ droppableId: parentKey, direction: 'vertical', isDropDisabled: !allowReorder }, { children: (droppableProvider) => (_jsxs(List, Object.assign({ ref: droppableProvider.innerRef }, droppableProvider.droppableProps, { children: [childKeys.map((childKey, index) => {
                        const childContent = renderChildContent(childKey);
                        const secondaryAction = renderSecondaryAction(childKey);
                        return (_jsx(Draggable, Object.assign({ draggableId: childKey, index: index, isDragDisabled: !allowReorder }, { children: (draggableProvider) => (_jsx(ListItem, Object.assign({ disablePadding: true, divider: index !== childKeys.length - 1, ref: draggableProvider.innerRef, secondaryAction: secondaryAction }, draggableProvider.draggableProps, draggableProvider.dragHandleProps, { children: childContent }), childKey)) }), childKey));
                    }), droppableProvider.placeholder] }))) })) })));
}
