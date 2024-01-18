import React from 'react';
import { ActionContent, Content, FunctionContent, ParameterSpec, ValueContent } from '../../types';
import { ContextMenuAction } from '../ContextMenu/ContentMenu';
import { DraggableProvided } from '@hello-pangea/dnd';
export interface ParameterListProps {
    contentKey: string;
    name: string;
    parent: Content;
}
export declare function ParameterList({ contentKey, name, parent }: ParameterListProps): import("react/jsx-runtime").JSX.Element;
interface ListItemProps<T extends Content> {
    content: T;
    editorId: string;
    selected: boolean;
    last: boolean;
    draggableProvided: DraggableProvided;
}
export interface ActionListItemProps extends ListItemProps<ActionContent> {
}
export declare function ActionListItem({ editorId, content, selected, last, draggableProvided, }: ActionListItemProps): import("react/jsx-runtime").JSX.Element | null;
export interface FunctionListItemProps extends ListItemProps<FunctionContent> {
    parameterSpec: ParameterSpec;
}
export declare function FunctionListItem({ editorId, content, selected, parameterSpec, last, draggableProvided, }: FunctionListItemProps): import("react/jsx-runtime").JSX.Element | null;
export interface ValueListItemProps extends ListItemProps<ValueContent> {
    parameterSpec: ParameterSpec;
}
export declare function ValueListItem({ editorId, content, selected, parameterSpec, last, draggableProvided, }: ValueListItemProps): import("react/jsx-runtime").JSX.Element | null;
export interface ParameterListItemProps {
    editorId: string;
    actions?: ContextMenuAction[];
    content: Content;
    selected: boolean;
    last: boolean;
    children: React.JSX.Element[] | React.JSX.Element | null;
    draggableProvided: DraggableProvided;
}
export declare function ParameterListItem({ editorId, actions, content, selected, last, children, draggableProvided, }: ParameterListItemProps): import("react/jsx-runtime").JSX.Element | null;
export {};
