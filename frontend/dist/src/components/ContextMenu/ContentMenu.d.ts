export interface ContextMenuAction {
    onClick: () => void;
    title: string;
    id: string;
    disabled?: boolean;
}
export interface ContentMenuProps {
    anchorEl: HTMLElement | null;
    actions?: ContextMenuAction[];
    open: boolean;
    handleClose: () => void;
}
export declare function ContextMenu({ anchorEl, open, actions, handleClose }: ContentMenuProps): import("react/jsx-runtime").JSX.Element | null;
