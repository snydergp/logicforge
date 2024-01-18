import { ActionContent, EngineSpec, FunctionContent, LogicForgeConfig, ProcessContent } from '../../types';
import React from 'react';
import './FrameEditor.scss';
import { TypeInfo } from '../../util';
export type EditorInfo = {
    editorId: string;
    engineSpec: EngineSpec;
    typeMappings: {
        [key: string]: TypeInfo;
    };
};
export declare const EditorContext: React.Context<EditorInfo | undefined>;
declare enum FrameType {
    PROCESS = 0,
    ACTION = 1,
    FUNCTION = 2
}
/**
 * The content types that are rendered using frames
 */
type FrameContent = ProcessContent | ActionContent | FunctionContent;
export type FrameEditorProps = {
    editorId: string;
    config: LogicForgeConfig;
    engineSpec: EngineSpec;
};
export declare function FrameEditor({ editorId, config, engineSpec }: FrameEditorProps): import("react/jsx-runtime").JSX.Element;
interface FrameProps {
    content: FrameContent;
}
export interface FunctionFrameProps extends FrameProps {
    content: FunctionContent;
}
export declare function FunctionFrame({ content }: FunctionFrameProps): import("react/jsx-runtime").JSX.Element;
export interface FrameHeadingProps {
    title: string;
    description?: string;
    subtitle: string;
    type: FrameType;
}
export declare function FrameHeading({ title, description, subtitle, type }: FrameHeadingProps): import("react/jsx-runtime").JSX.Element;
export {};
