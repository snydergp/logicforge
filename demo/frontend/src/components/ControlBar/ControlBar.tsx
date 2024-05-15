import { Box, Button, CircularProgress } from '@mui/material';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { ActionCreators } from 'redux-undo';
import { Redo, Save, Undo } from '@mui/icons-material';
import {
  exportProcess,
  LogicForgeReduxState,
  selectCanRedo,
  selectCanUndo,
  selectContent,
  selectRootContentKey,
} from 'logicforge';
import { ProcessConfig } from 'logicforge/dist/types';
import { AnyAction } from '@reduxjs/toolkit';

export interface ControlBarProps {
  save: (processConfig: ProcessConfig) => Promise<void>;
}

export function ControlBar({ save }: ControlBarProps) {
  const dispatch = useDispatch();

  const undo = useCallback(() => {
    dispatch(ActionCreators.undo());
  }, [dispatch]);
  const canUndo = useSelector(selectCanUndo);

  const redo = useCallback(() => {
    dispatch(ActionCreators.redo());
  }, [dispatch]);
  const canRedo = useSelector(selectCanRedo);

  const store = useStore<LogicForgeReduxState, AnyAction>();
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(() => {
    // we use the store directly rather than useSelector because the store content isn't always
    //  initialized during this component's lifetime
    const rootKey = selectRootContentKey(store.getState());
    const indexedContent = selectContent(store.getState());
    const process = exportProcess(rootKey, indexedContent);
    setSaving(true);
    save(process).finally(() => setSaving(false));
  }, [exportProcess, store, save, setSaving]);

  // TODO: Undo/Redo left, Save/Test Toggle right
  return (
    <Box width={'100%'} display={'inline-flex'}>
      <Box flexGrow={1}>
        <Button onClick={undo} disabled={!canUndo} startIcon={<Undo />}>
          Undo
        </Button>
        <Button onClick={redo} disabled={!canRedo} startIcon={<Redo />}>
          Redo
        </Button>
      </Box>
      <Box>
        <Button
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress /> : <Save />}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
}
