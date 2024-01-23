import { OnDragEndResponder } from '@hello-pangea/dnd';
import { JSX } from 'react';
export interface ReorderableListProps {
    parentKey: string;
    onDragEnd: OnDragEndResponder;
    allowReorder: boolean;
    childKeys: string[];
    renderChildContent: (childKey: string) => JSX.Element;
    renderSecondaryAction: (childKey: string) => JSX.Element;
}
export declare function ReorderableContentList({ parentKey, onDragEnd, allowReorder, childKeys, renderChildContent, renderSecondaryAction, }: ReorderableListProps): import("react/jsx-runtime").JSX.Element;
