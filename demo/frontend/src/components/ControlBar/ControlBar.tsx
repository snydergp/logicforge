import { Box, Button } from '@mui/material';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ActionCreators } from 'redux-undo';
import { Redo, Undo } from '@mui/icons-material';

export interface ControlBarProps {}

export function ControlBar({}: ControlBarProps) {
  const dispatch = useDispatch();

  const undo = useCallback(() => {
    dispatch(ActionCreators.undo());
  }, [dispatch]);
  const canUndo = useSelector(selectCanUndo);

  const redo = useCallback(() => {
    dispatch(ActionCreators.redo());
  }, [dispatch]);
  const canRedo = useSelector(selectCanRedo);

  // TODO: Undo/Redo left, Save/Test Toggle right
  return (
    <Box>
      <Box justifyContent={'left'}>
        <Button onClick={undo} disabled={!canUndo} startIcon={<Undo />}>
          Undo
        </Button>
        <Button onClick={redo} disabled={!canRedo} startIcon={<Redo />}>
          Redo
        </Button>
      </Box>
      <Box justifyContent={'right'}>
        <Button onClick={undo} disabled={!canUndo} startIcon={<Undo />}>
          {undoLabel}
        </Button>
        <Button onClick={redo} disabled={!canRedo} startIcon={<Redo />}>
          {redoLabel}
        </Button>
      </Box>
    </Box>
  );
}
