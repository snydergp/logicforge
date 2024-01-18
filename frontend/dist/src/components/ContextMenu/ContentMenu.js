import { jsx as _jsx } from "react/jsx-runtime";
import { Menu, MenuItem } from '@mui/material';
export function ContextMenu({ anchorEl, open, actions, handleClose }) {
    return actions !== undefined && actions.length > 0 ? (_jsx(Menu, Object.assign({ open: open, anchorEl: anchorEl, onClose: handleClose }, { children: actions.map((action) => {
            return (_jsx(MenuItem, Object.assign({ onClick: (event) => {
                    action.onClick();
                    handleClose();
                    event.stopPropagation();
                }, disabled: action.disabled }, { children: action.title }), action.id));
        }) }))) : null;
}
