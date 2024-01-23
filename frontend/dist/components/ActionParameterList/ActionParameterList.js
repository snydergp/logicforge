import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EditorContext } from '../FrameEditor/FrameEditor';
import { ContentType, } from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import { addAction, deleteItem, reorderItem, selectContentByKey, selectSelectedSubtree, setSelection, } from '../../redux/slices/editors';
import { ParameterHeading } from '../ParameterHeading/ParameterHeading';
import { Box, Button, Dialog, IconButton, List, ListItem, ListItemButton, ListItemText, } from '@mui/material';
import { useTranslate } from 'react-polyglot';
import { actionDescriptionPath, actionParameterDescriptionPath, actionParameterTitlePath, actionTitlePath, processParameterDescriptionPath, processParameterTitlePath, } from '../../util';
import MenuIcon from '@mui/icons-material/Menu';
import RunIcon from '@mui/icons-material/DirectionsRun';
import { ContextMenu } from '../ContextMenu/ContentMenu';
import { ReorderableContentList } from '../ReorderableContentList/ReorderableContentList';
export function ActionParameterList({ contentKey, name, parent }) {
    const { editorId, engineSpec } = useContext(EditorContext);
    const [dialogOpen, setDialogOpen] = useState(false);
    const content = useSelector(selectContentByKey(editorId, contentKey));
    const selection = useSelector((state) => selectSelectedSubtree(state, editorId));
    const selectionDepth = selection !== undefined
        ? selection.findIndex((selectedContent) => contentKey === selectedContent.key)
        : -1;
    function isChildSelected(contentKey) {
        if (selectionDepth >= 0 && selection !== undefined && selectionDepth + 1 < selection.length) {
            const selectedChild = selection[selectionDepth + 1];
            return selectedChild.key === contentKey;
        }
        return false;
    }
    const dispatch = useDispatch();
    const translate = useTranslate();
    const openDialog = useCallback(() => {
        setDialogOpen(true);
    }, [setDialogOpen]);
    const closeDialog = useCallback(() => {
        setDialogOpen(false);
    }, [setDialogOpen]);
    const handleAddItem = useCallback((actionName) => {
        dispatch(addAction(contentKey, editorId, actionName));
        setDialogOpen(false);
    }, [dispatch, editorId]);
    const handleDragEnd = useCallback((result) => {
        if (result.destination) {
            const startIndex = result.source.index;
            const endIndex = result.destination.index;
            dispatch(reorderItem(contentKey, editorId, startIndex, endIndex));
        }
    }, [dispatch, editorId]);
    const handleRenderChildContent = useCallback((childKey) => {
        return (_jsx(ActionButton, { editorId: editorId, contentKey: childKey, selected: isChildSelected(childKey) }));
    }, [editorId]);
    const handleRenderContextMenuButton = useCallback((childKey) => {
        return _jsx(ContextMenuButton, { editorId: editorId, contentKey: childKey });
    }, [editorId]);
    if (content !== undefined && selection !== undefined) {
        if (content.type !== ContentType.PROCESS && content.type !== ContentType.ACTION_LIST) {
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
        else if (parent.type === ContentType.ACTION) {
            const actionEditorState = parent;
            title = translate(actionParameterTitlePath(actionEditorState.name, name));
            description = translate(actionParameterDescriptionPath(actionEditorState.name, name));
        }
        return (_jsxs(Box, Object.assign({ sx: { mx: 2, my: 1 } }, { children: [_jsx(ParameterHeading, { title: title, description: description, subtitle: description }), _jsx(ReorderableContentList, { parentKey: parent.key, onDragEnd: handleDragEnd, allowReorder: true, childKeys: listState.childKeys, renderChildContent: handleRenderChildContent, renderSecondaryAction: handleRenderContextMenuButton }), _jsx(Box, Object.assign({ sx: { display: 'flex', flexDirection: 'row-reverse', width: '100%' } }, { children: _jsx(Button, Object.assign({ onClick: openDialog, disabled: dialogOpen }, { children: "Add Action" })) })), _jsx(ActionSelectionDialog, { open: dialogOpen, cancel: closeDialog, select: handleAddItem, actions: engineSpec.actions })] })));
    }
    return _jsx("div", {});
}
function ContextMenuButton({ editorId, contentKey }) {
    const dispatch = useDispatch();
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
        dispatch(deleteItem(contentKey, editorId));
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
function ActionButton({ editorId, contentKey, selected }) {
    const dispatch = useDispatch();
    const content = useSelector(selectContentByKey(editorId, contentKey));
    const translate = useTranslate();
    const handleClick = useCallback(() => {
        dispatch(setSelection(contentKey, editorId));
    }, [dispatch, editorId, contentKey]);
    if (content != undefined && content.type === ContentType.ACTION) {
        const action = content;
        const title = translate(actionTitlePath(action.name));
        const description = translate(actionDescriptionPath(action.name));
        return (_jsxs(ListItemButton, Object.assign({ selected: selected, onClick: handleClick }, { children: [_jsx(RunIcon, { sx: { mr: 1 } }), _jsx(ListItemText, { primary: title, secondary: _jsx("span", { children: description }) })] })));
    }
    return null;
}
function ActionSelectionDialog({ open, cancel, select, actions }) {
    const translate = useTranslate();
    return (_jsxs(Dialog, Object.assign({ open: open }, { children: [_jsx(List, { children: Object.entries(actions).map(([name]) => {
                    const title = translate(actionTitlePath(name));
                    const description = translate(actionDescriptionPath(name));
                    return (_jsx(ListItem, { children: _jsx(ListItemButton, Object.assign({ onClick: () => select(name) }, { children: _jsx(ListItemText, { primary: title, secondary: _jsx("span", { children: description }) }) })) }, name));
                }) }), _jsx(Box, Object.assign({ sx: { display: 'flex', flexDirection: 'row-reverse', width: '100%' } }, { children: _jsx(Button, Object.assign({ onClick: cancel }, { children: "Cancel" })) }))] })));
}
