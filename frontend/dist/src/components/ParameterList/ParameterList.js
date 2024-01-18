import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../FrameEditor/FrameEditor';
import { ContentType, } from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import { addValue, deleteItem, reorderItem, selectContentByKey, selectIsKeySelected, selectParameterSpecificationForKey, selectSelectedSubtree, setSelection, } from '../../redux/slices/editors';
import { ParameterHeading } from '../ParameterHeading/ParameterHeading';
import { Box, Button, IconButton, List, ListItem, ListItemButton, ListItemText, } from '@mui/material';
import { useTranslate } from 'react-polyglot';
import { actionDescriptionPath, actionParameterDescriptionPath, actionParameterTitlePath, actionTitlePath, functionDescriptionPath, functionParameterDescriptionPath, functionParameterTitlePath, functionTitlePath, processParameterDescriptionPath, processParameterTitlePath, } from '../../util/translation-paths';
import MenuIcon from '@mui/icons-material/Menu';
import RunIcon from '@mui/icons-material/DirectionsRun';
import { FunctionIcon } from '../Icons/Icons';
import { ValueEditor } from '../ValueEditor/ValueEditor';
import { ContextMenu } from '../ContextMenu/ContentMenu';
import { DragDropContext, Draggable, Droppable, } from '@hello-pangea/dnd';
export function ParameterList({ contentKey, name, parent }) {
    const { editorId } = useContext(EditorContext);
    const content = useSelector(selectContentByKey(editorId, contentKey));
    const selection = useSelector((state) => selectSelectedSubtree(state, editorId));
    const dispatch = useDispatch();
    const translate = useTranslate();
    const addItemFunction = useCallback(() => {
        if (content !== undefined) {
            dispatch(addValue(content.key, editorId));
        }
    }, []);
    const handleDragEnd = useCallback((result) => {
        if (result.destination) {
            const startIndex = result.source.index;
            const endIndex = result.destination.index;
            dispatch(reorderItem(contentKey, editorId, startIndex, endIndex));
        }
    }, [dispatch, editorId]);
    const parameterSpec = useSelector(selectParameterSpecificationForKey(editorId, content === null || content === void 0 ? void 0 : content.key));
    if (content !== undefined && selection !== undefined) {
        if (content.type !== ContentType.PROCESS &&
            content.type !== ContentType.ACTION_LIST &&
            content.type !== ContentType.INPUT_LIST) {
            throw new Error(`Unexpected state at key ${content.key} -- expected actions, found ${content.type}`);
        }
        const listState = content;
        let title = '';
        let description = '';
        if (parent.type === ContentType.PROCESS) {
            const processEditorState = parent;
            title = translate(processParameterTitlePath(processEditorState.name, name));
            description = translate(processParameterDescriptionPath(processEditorState.name, name));
        }
        if (parent.type === ContentType.PROCESS) {
            // TODO move this into translations
            title = 'Actions';
            description = 'Root actions';
        }
        if (parent.type === ContentType.ACTION) {
            const actionEditorState = parent;
            title = translate(actionParameterTitlePath(actionEditorState.name, name));
            description = translate(actionParameterDescriptionPath(actionEditorState.name, name));
        }
        else if (parent.type === ContentType.FUNCTION) {
            const functionEditorState = parent;
            title = translate(functionParameterTitlePath(functionEditorState.name, name));
            description = translate(functionParameterDescriptionPath(functionEditorState.name, name));
        }
        const allowReorder = parameterSpec === undefined || parameterSpec.multi;
        return (_jsxs(Box, Object.assign({ sx: { mx: 2, my: 1 } }, { children: [_jsx(ParameterHeading, { title: title, description: description, subtitle: description }), _jsx(DragDropContext, Object.assign({ onDragEnd: handleDragEnd }, { children: _jsx(Droppable, Object.assign({ droppableId: contentKey, direction: 'vertical', isDropDisabled: !allowReorder }, { children: (droppableProvider) => (_jsxs(List, Object.assign({ ref: droppableProvider.innerRef }, droppableProvider.droppableProps, { children: [listState.childKeys.map((childKey, index) => {
                                    return (_jsx(Draggable, Object.assign({ draggableId: childKey, index: index, isDragDisabled: !allowReorder }, { children: (draggableProvider) => (_jsx(ListItemWrapper, { editorId: editorId, parameterSpec: parameterSpec, contentKey: childKey, last: index === listState.childKeys.length - 1, draggableProvided: draggableProvider }, childKey)) }), childKey));
                                }), droppableProvider.placeholder] }))) })) })), renderControls(addItemFunction, parameterSpec)] })));
    }
    return _jsx("div", {});
}
function ListItemWrapper({ editorId, contentKey, parameterSpec, last, draggableProvided, }) {
    const content = useSelector(selectContentByKey(editorId, contentKey));
    const selected = useSelector(selectIsKeySelected(editorId, contentKey));
    switch (content.type) {
        case ContentType.ACTION:
            return (_jsx(ActionListItem, { content: content, editorId: editorId, selected: selected, last: last, draggableProvided: draggableProvided }));
        case ContentType.FUNCTION:
            return (_jsx(FunctionListItem, { content: content, editorId: editorId, selected: selected, parameterSpec: parameterSpec, last: last, draggableProvided: draggableProvided }));
        case ContentType.VALUE:
            return (_jsx(ValueListItem, { content: content, editorId: editorId, selected: selected, parameterSpec: parameterSpec, last: last, draggableProvided: draggableProvided }));
    }
    return null;
}
function renderControls(addItem, parameterSpec) {
    if (parameterSpec !== undefined && parameterSpec.multi) {
        return (_jsx(Box, Object.assign({ sx: { display: 'flex', flexDirection: 'row-reverse', width: '100%' } }, { children: _jsx(Button, Object.assign({ onClick: addItem }, { children: "Add" })) })));
    }
    else {
        return _jsx("span", {});
    }
}
export function ActionListItem({ editorId, content, selected, last, draggableProvided, }) {
    const dispatch = useDispatch();
    const translate = useTranslate();
    const doDelete = useCallback(() => {
        if (content !== undefined) {
            dispatch(deleteItem(content.key, editorId));
        }
    }, []);
    const actions = [
        {
            title: 'Delete',
            id: 'delete',
            onClick: doDelete,
        },
    ];
    if (content != undefined && content.type === ContentType.ACTION) {
        const action = content;
        const title = translate(actionTitlePath(action.name));
        const description = translate(actionDescriptionPath(action.name));
        return (_jsxs(ParameterListItem, Object.assign({ editorId: editorId, actions: actions, content: content, selected: selected, last: last, draggableProvided: draggableProvided }, { children: [_jsx(RunIcon, { sx: { mr: 1 } }), _jsx(ListItemText, { primary: title, secondary: _jsx("span", { children: description }) })] })));
    }
    return null;
}
export function FunctionListItem({ editorId, content, selected, parameterSpec, last, draggableProvided, }) {
    const dispatch = useDispatch();
    const translate = useTranslate();
    const doDelete = useCallback(() => {
        if (content !== undefined) {
            dispatch(deleteItem(content.key, editorId));
        }
    }, []);
    const actions = [];
    if (parameterSpec.multi) {
        actions.push({
            title: 'Delete',
            id: 'delete',
            onClick: doDelete,
        });
    }
    if (content !== undefined && content.type === ContentType.FUNCTION) {
        const functionContent = content;
        const title = translate(functionTitlePath(functionContent.name));
        const description = translate(functionDescriptionPath(functionContent.name));
        return (_jsxs(ParameterListItem, Object.assign({ editorId: editorId, actions: actions, content: content, selected: selected, last: last, draggableProvided: draggableProvided }, { children: [_jsx(FunctionIcon, { sx: { mr: 1 } }), _jsx(ListItemText, { primary: title, secondary: _jsx("span", { children: description }) })] })));
    }
    return null;
}
export function ValueListItem({ editorId, content, selected, parameterSpec, last, draggableProvided, }) {
    const dispatch = useDispatch();
    const doDelete = useCallback(() => {
        if (content !== undefined) {
            dispatch(deleteItem(content.key, editorId));
        }
    }, []);
    const actions = [];
    if (parameterSpec.multi) {
        actions.push({
            title: 'Delete',
            id: 'delete',
            onClick: doDelete,
        });
    }
    if (content != undefined && content.type === ContentType.VALUE) {
        const value = content;
        return (_jsx(ParameterListItem, Object.assign({ editorId: editorId, actions: actions, content: content, selected: selected, last: last, draggableProvided: draggableProvided }, { children: _jsx(ValueEditor, { parameterSpec: parameterSpec, content: value }) })));
    }
    return null;
}
export function ParameterListItem({ editorId, actions, content, selected, last, children, draggableProvided, }) {
    const dispatch = useDispatch();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        setOpen(anchorEl !== null);
    }, [anchorEl]);
    const handleClickMenuHandle = (event) => {
        setAnchorEl(event.currentTarget);
        event.stopPropagation();
    };
    const handleClose = () => {
        setOpen(false);
        setAnchorEl(null);
    };
    if (content != undefined) {
        return (_jsx(ListItem, Object.assign({ onClick: () => dispatch(setSelection(content.key, editorId)), disablePadding: true, divider: !last, secondaryAction: _jsxs("div", { children: [_jsx(IconButton, Object.assign({ edge: "end", "aria-label": "actions", onClick: handleClickMenuHandle }, draggableProvided.dragHandleProps, { children: _jsx(MenuIcon, {}) })), _jsx(ContextMenu, { anchorEl: anchorEl, open: open, handleClose: handleClose, actions: actions })] }), ref: draggableProvided.innerRef }, draggableProvided.draggableProps, { children: _jsx(ListItemButton, Object.assign({ selected: selected }, { children: children })) }), content.key));
    }
    return null;
}
