import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDispatch, useSelector } from 'react-redux';
import { Box, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import { ContentType, } from '../../types';
import { initEditor, selectSelectedSubtree } from '../../redux/slices/editors';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslate } from 'react-polyglot';
import { actionDescriptionPath, actionTitlePath, functionDescriptionPath, functionTitlePath, processDescriptionPath, processTitlePath, } from '../../util/translation-paths';
import { ParameterList } from '../ParameterList/ParameterList';
import './FrameEditor.scss';
import { Info } from '../Info/Info';
import { ActionIcon, FunctionIcon, ProcessIcon } from '../Icons/Icons';
import { generateTypeMappings } from '../../util';
export const EditorContext = React.createContext(undefined);
var FrameType;
(function (FrameType) {
    FrameType[FrameType["PROCESS"] = 0] = "PROCESS";
    FrameType[FrameType["ACTION"] = 1] = "ACTION";
    FrameType[FrameType["FUNCTION"] = 2] = "FUNCTION";
})(FrameType || (FrameType = {}));
export function FrameEditor({ editorId, config, engineSpec }) {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(initEditor(config, engineSpec, editorId));
    }, []);
    const selection = useSelector((state) => selectSelectedSubtree(state, editorId));
    const [childFrames, setChildFrames] = useState([]);
    const typeMappings = generateTypeMappings(engineSpec.types);
    const editorInfo = {
        editorId,
        engineSpec,
        typeMappings,
    };
    useEffect(() => {
        const children = [];
        if (selection !== undefined) {
            for (let i = 0; i < selection.length; i++) {
                const content = selection[i];
                const contentType = content.type;
                if (contentType === ContentType.PROCESS ||
                    contentType === ContentType.ACTION ||
                    contentType === ContentType.FUNCTION) {
                    children.push(_jsx(Frame, { content: content }, content.key));
                }
            }
        }
        setChildFrames(children);
    }, [selection, setChildFrames]);
    return (_jsx(EditorContext.Provider, Object.assign({ value: editorInfo }, { children: _jsx("div", Object.assign({ className: 'logicforgeProcessEditor' }, { children: _jsx(Stack, Object.assign({ direction: "row", spacing: 0, divider: _jsx(Divider, { orientation: "vertical", flexItem: true }) }, { children: childFrames })) })) })));
}
function Frame({ content }) {
    let renderedFrameContents = null;
    switch (content.type) {
        case ContentType.PROCESS:
            renderedFrameContents = _jsx(ProcessFrame, { content: content });
            break;
        case ContentType.ACTION:
            renderedFrameContents = _jsx(ActionFrame, { content: content });
            break;
        case ContentType.FUNCTION:
            renderedFrameContents = _jsx(FunctionFrame, { content: content });
            break;
    }
    return (_jsx("div", Object.assign({ className: 'logicforgeFrameEditor__frame' }, { children: _jsx(Container, Object.assign({ sx: { my: 1, width: '400px' } }, { children: renderedFrameContents })) })));
}
function ProcessFrame({ content }) {
    const editorInfo = useContext(EditorContext);
    const processName = content.name;
    const specification = editorInfo.engineSpec.processes[processName];
    const translate = useTranslate();
    const title = translate(processTitlePath(processName));
    const description = translate(processDescriptionPath(processName));
    return (_jsxs(Stack, Object.assign({ spacing: 1, className: 'logicforgeFrameEditor__processFrame' }, { children: [_jsx(FrameHeading, { title: title, description: description, subtitle: 'Process', type: FrameType.PROCESS }), _jsx(Paper, { children: _jsx(ParameterList, { contentKey: content.key, name: 'root', parent: content }) })] })));
}
function ActionFrame({ content }) {
    var _a, _b;
    const editorInfo = useContext(EditorContext);
    const actionName = content.name;
    const specification = editorInfo.engineSpec.actions[actionName];
    const translate = useTranslate();
    const title = translate(actionTitlePath(actionName));
    const description = translate(actionDescriptionPath(actionName));
    return (_jsxs(Stack, Object.assign({ spacing: 1, className: 'logicforgeFrameEditor__actionFrame' }, { children: [_jsx(FrameHeading, { title: title, subtitle: 'Action', description: description, type: FrameType.ACTION }), (_a = Object.entries(specification.actionParameters)) === null || _a === void 0 ? void 0 : _a.map(([name]) => {
                return (_jsx(Paper, { children: _jsx(ParameterList, { contentKey: content.actionChildKeys[name], name: name, parent: content }) }, name));
            }), (_b = Object.entries(specification.inputParameters)) === null || _b === void 0 ? void 0 : _b.map(([name]) => {
                return (_jsx(Paper, { children: _jsx(ParameterList, { contentKey: content.inputChildKeys[name], name: name, parent: content }) }, name));
            })] })));
}
export function FunctionFrame({ content }) {
    var _a;
    const editorInfo = useContext(EditorContext);
    const functionName = content.name;
    const specification = editorInfo.engineSpec.functions[functionName];
    const translate = useTranslate();
    const title = translate(functionTitlePath(functionName));
    const description = translate(functionDescriptionPath(functionName));
    return (_jsxs("div", Object.assign({ className: 'logicforgeFrameEditor__functionFrame' }, { children: [_jsx(FrameHeading, { title: title, subtitle: 'Function', description: description, type: FrameType.FUNCTION }), _jsx(Stack, Object.assign({ spacing: 1 }, { children: (_a = Object.entries(specification.parameters)) === null || _a === void 0 ? void 0 : _a.map(([name]) => {
                    return (_jsx(Paper, { children: _jsx(ParameterList, { contentKey: content.childKeys[name], name: name, parent: content }) }, name));
                }) }))] })));
}
export function FrameHeading({ title, description, subtitle, type }) {
    return (_jsx(Stack, Object.assign({ direction: "row" }, { children: _jsxs(Box, Object.assign({ sx: { mb: 1.5 }, className: 'logicforgeFrameHeading' }, { children: [_jsxs(Typography, Object.assign({ variant: 'h4', className: 'logicforgeFrameHeading__title' }, { children: [title, description !== undefined && _jsx(Info, { text: description })] })), subtitle !== undefined && (_jsxs(Typography, Object.assign({ variant: 'h5', className: 'logicforgeFrameHeading__subtitle' }, { children: [FrameIcon({ type }), subtitle] })))] })) })));
}
function FrameIcon({ type }) {
    switch (type) {
        case FrameType.PROCESS:
            return _jsx(ProcessIcon, { fontSize: 'small', sx: { mb: '-5px', mr: '5px' } });
        case FrameType.ACTION:
            return _jsx(ActionIcon, { fontSize: 'small', sx: { mb: '-5px', mr: '2px' } });
        case FrameType.FUNCTION:
            return _jsx(FunctionIcon, { fontSize: 'small', sx: { mb: '-5px', mr: '2px' } });
    }
}
