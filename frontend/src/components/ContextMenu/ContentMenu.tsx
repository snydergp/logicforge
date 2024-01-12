import { IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import React from 'react';

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

export function ContextMenu({ anchorEl, open, actions, handleClose }: ContentMenuProps) {
  return actions !== undefined && actions.length > 0 ? (
    <Menu open={open} anchorEl={anchorEl} onClose={handleClose}>
      {(actions as ContextMenuAction[]).map((action) => {
        return (
          <MenuItem
            key={action.id}
            onClick={(event) => {
              action.onClick();
              handleClose();
              event.stopPropagation();
            }}
            disabled={action.disabled}
          >
            {action.title}
          </MenuItem>
        );
      })}
    </Menu>
  ) : null;
}
