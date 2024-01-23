import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EditorContext } from '../FrameEditor/FrameEditor';
import { ContentType, } from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import { addValue, deleteItem, reorderItem, selectContentByKey, selectParameterSpecificationForKey, selectSelectedSubtree, setSelection, setValue, } from '../../redux/slices/editors';
import { ParameterHeading } from '../ParameterHeading/ParameterHeading';
import { Box, Button, IconButton, ListItemButton, ListItemText } from '@mui/material';
import { useTranslate } from 'react-polyglot';
import { actionParameterDescriptionPath, actionParameterTitlePath, functionDescriptionPath, functionParameterDescriptionPath, functionParameterTitlePath, functionTitlePath, } from '../../util';
import MenuIcon from '@mui/icons-material/Menu';
import { ContextMenu } from '../ContextMenu/ContentMenu';
import { ReorderableContentList } from '../ReorderableContentList/ReorderableContentList';
import { ValueEditor } from '../ValueEditor/ValueEditor';
import { FunctionIcon } from '../Icons/Icons';
export function InputParameterList({ contentKey, name, parent }) {
    const { editorId, engineSpec } = useContext(EditorContext);
    const content = useSelector(selectContentByKey(editorId, contentKey));
    const selection = useSelector((state) => selectSelectedSubtree(state, editorId));
    const selectionDepth = selection !== undefined
        ? selection.findIndex((selectedContent) => contentKey === selectedContent.key)
        : -1;
    const parameterSpec = useSelector(selectParameterSpecificationForKey(editorId, contentKey));
    function isChildSelected(contentKey) {
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
    const handleDragEnd = useCallback((result) => {
        if (result.destination) {
            const startIndex = result.source.index;
            const endIndex = result.destination.index;
            dispatch(reorderItem(contentKey, editorId, startIndex, endIndex));
        }
    }, [dispatch, editorId]);
    const handleRenderChildContent = useCallback((childKey) => {
        return (_jsx(InputButton, { editorId: editorId, contentKey: childKey, selected: isChildSelected(childKey) }));
    }, [editorId]);
    const handleRenderContextMenuButton = useCallback((childKey) => {
        return _jsx(ContextMenuButton, { editorId: editorId, contentKey: childKey });
    }, [editorId]);
    if (content !== undefined && selection !== undefined) {
        if (content.type !== ContentType.INPUT_LIST) {
            throw new Error(`Unexpected state at key ${content.key} -- expected actions, found ${content.type}`);
        }
        const listState = content;
        let title = '';
        let description = '';
        if (parent.type === ContentType.ACTION) {
            const actionEditorState = parent;
            title = translate(actionParameterTitlePath(actionEditorState.name, name));
            description = translate(actionParameterDescriptionPath(actionEditorState.name, name));
        }
        else {
            const functionContent = parent;
            title = translate(functionParameterTitlePath(functionContent.name, name));
            description = translate(functionParameterDescriptionPath(functionContent.name, name));
        }
        return (_jsxs(Box, Object.assign({ sx: { mx: 2, my: 1 } }, { children: [_jsx(ParameterHeading, { title: title, description: description, subtitle: description }), _jsx(ReorderableContentList, { parentKey: parent.key, onDragEnd: handleDragEnd, allowReorder: parameterSpec.multi, childKeys: listState.childKeys, renderChildContent: handleRenderChildContent, renderSecondaryAction: handleRenderContextMenuButton }), parameterSpec.multi && (_jsx(Box, Object.assign({ sx: { display: 'flex', flexDirection: 'row-reverse', width: '100%' } }, { children: _jsx(Button, Object.assign({ onClick: handleAddItem }, { children: "Add Value" })) })))] })));
    }
    return null;
}
function ContextMenuButton({ editorId, contentKey }) {
    const dispatch = useDispatch();
    const parameterSpec = useSelector(selectParameterSpecificationForKey(editorId, contentKey));
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        setOpen(anchorEl !== null);
    }, [anchorEl]);
    const handleClickMenuHandle = useCallback((event) => {
        setAnchorEl(event.currentTarget);
        event.stopPropagation();
    }, [setAnchorEl]);
    const handleClose = useCallback(() => {
        setOpen(false);
        setAnchorEl(null);
    }, [setOpen, setAnchorEl]);
    const handleDelete = useCallback(() => {
        if (parameterSpec !== undefined && !parameterSpec.multi) {
            dispatch(setValue('', editorId, contentKey));
        }
        else {
            dispatch(deleteItem(contentKey, editorId));
        }
    }, [dispatch, editorId, contentKey]);
    const actions = useMemo(() => [
        {
            onClick: handleDelete,
            title: 'Delete',
            id: 'delete',
        },
    ], [handleDelete]);
    return (_jsxs("div", { children: [_jsx(IconButton, Object.assign({ edge: "end", "aria-label": "actions", onClick: handleClickMenuHandle }, { children: _jsx(MenuIcon, {}) })), _jsx(ContextMenu, { anchorEl: anchorEl, open: open, handleClose: handleClose, actions: actions })] }));
}
function InputButton({ editorId, contentKey, selected }) {
    const dispatch = useDispatch();
    const content = useSelector(selectContentByKey(editorId, contentKey));
    const parameterSpec = useSelector(selectParameterSpecificationForKey(editorId, contentKey));
    const handleClick = useCallback(() => {
        dispatch(setSelection(contentKey, editorId));
    }, [dispatch, editorId, contentKey]);
    const translate = useTranslate();
    if (content !== undefined) {
        if (content.type === ContentType.FUNCTION) {
            const functionContent = content;
            const title = translate(functionTitlePath(functionContent.name));
            const description = translate(functionDescriptionPath(functionContent.name));
            return (_jsxs(ListItemButton, Object.assign({ selected: selected, onClick: handleClick }, { children: [_jsx(FunctionIcon, { sx: { mr: 1 } }), _jsx(ListItemText, { primary: title, secondary: _jsx("span", { children: description }) })] })));
        }
        else if (content.type === ContentType.VALUE && parameterSpec !== undefined) {
            return (_jsx(ListItemButton, Object.assign({ selected: selected, onClick: handleClick }, { children: _jsx(ValueEditor, { parameterSpec: parameterSpec, content: content }) })));
        }
    }
    return null;
}
