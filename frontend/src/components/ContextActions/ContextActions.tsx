import { useDispatch, useSelector } from 'react-redux';
import { ErrorLevel, ValidationError } from '../../types';
import { deleteItem, selectContent } from '../../redux/slices/frameEditorSlice';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ContextMenu, ContextMenuAction } from '../ContextMenu/ContentMenu';
import { Box, IconButton, Stack } from '@mui/material';
import { Error as ErrorIcon, ErrorOutline, Warning, WarningAmber } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import { StyledTooltip } from '../Info/Info';
import { useTranslate } from '../I18n/I18n';
import { errorKey, labelKey, recurseDown } from '../../util';

export interface ContextActionsProps {
  contentKey: string;
}

enum ErrorDisplayMode {
  DIRECT_ERROR,
  INDIRECT_ERROR,
  DIRECT_WARNING,
  INDIRECT_WARNING,
  NONE,
}

export function ContextActions({ contentKey }: ContextActionsProps) {
  const dispatch = useDispatch();

  const allContent = useSelector(selectContent);

  const errorCounts: CategorizedErrors = useMemo(() => {
    const direct = allContent[contentKey].errors || [];
    const directErrors = direct.filter((err) => err.level === ErrorLevel.ERROR);
    const directWarnings = direct.filter((err) => err.level === ErrorLevel.WARNING);
    const indirectErrors: ValidationError[] = [];
    const indirectWarnings: ValidationError[] = [];
    recurseDown(
      allContent,
      (content) => {
        const key = content.key;
        if (key !== contentKey) {
          indirectErrors.push(...content.errors.filter((err) => err.level === ErrorLevel.ERROR));
          indirectWarnings.push(
            ...content.errors.filter((err) => err.level === ErrorLevel.WARNING),
          );
        }
      },
      contentKey,
    );
    return { directErrors, directWarnings, indirectErrors, indirectWarnings };
  }, [contentKey, allContent]);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(anchorEl !== null);
  }, [anchorEl]);

  const handleClickMenuHandle = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
      event.stopPropagation();
    },
    [setAnchorEl],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setAnchorEl(null);
  }, [setOpen, setAnchorEl]);

  const handleDelete = useCallback(() => {
    dispatch(deleteItem(contentKey));
  }, [dispatch, contentKey]);

  const actions: ContextMenuAction[] = useMemo(
    () => [
      {
        onClick: handleDelete,
        title: 'Delete',
        id: 'delete',
      },
    ],
    [handleDelete],
  );

  return (
    <Stack direction={'row'}>
      <ErrorDisplay {...errorCounts} />
      <IconButton edge="end" aria-label="actions" onClick={handleClickMenuHandle}>
        <MenuIcon />
      </IconButton>
      <ContextMenu anchorEl={anchorEl} open={open} handleClose={handleClose} actions={actions} />
    </Stack>
  );
}

function ErrorDisplay(categorizedErrors: CategorizedErrors) {
  const { directErrors, indirectErrors, directWarnings, indirectWarnings } = categorizedErrors;
  const errorDisplayMode: ErrorDisplayMode = useMemo(() => {
    if (directErrors.length) {
      return ErrorDisplayMode.DIRECT_ERROR;
    } else if (indirectErrors.length) {
      return ErrorDisplayMode.INDIRECT_ERROR;
    } else if (directWarnings.length) {
      return ErrorDisplayMode.DIRECT_WARNING;
    } else if (indirectWarnings.length) {
      return ErrorDisplayMode.INDIRECT_WARNING;
    } else {
      return ErrorDisplayMode.NONE;
    }
  }, [directErrors, directWarnings, indirectErrors, indirectWarnings]);

  const translate = useTranslate();
  const tooltipContent = useMemo(() => {
    const lines: string[] = [];

    function translateError(error: ValidationError) {
      lines.push(translate(errorKey(error.code), error.data));
    }

    directErrors.forEach(translateError);
    directWarnings.forEach(translateError);
    if (indirectErrors.length > 0) {
      lines.push(`${translate(labelKey('child-errors'))}: ${indirectErrors.length}`);
    }
    if (indirectWarnings.length > 0) {
      lines.push(`${translate(labelKey('child-warnings'))}: ${indirectWarnings.length}`);
    }
    return lines.join('\n');
  }, [translate, directErrors, directWarnings, indirectErrors, indirectWarnings]);

  return (
    <>
      {errorDisplayMode !== ErrorDisplayMode.NONE && (
        <IconButton
          edge="end"
          aria-label="actions"
          disableRipple
          disableFocusRipple
          disableTouchRipple
        >
          <StyledTooltip title={tooltipContent}>
            <Box sx={{ mt: '5px' }}>
              {errorDisplayMode === ErrorDisplayMode.DIRECT_ERROR && <ErrorIcon color={'error'} />}
              {errorDisplayMode === ErrorDisplayMode.INDIRECT_ERROR && (
                <ErrorOutline color={'error'} />
              )}
              {errorDisplayMode === ErrorDisplayMode.DIRECT_WARNING && (
                <Warning color={'warning'} />
              )}
              {errorDisplayMode === ErrorDisplayMode.INDIRECT_WARNING && (
                <WarningAmber color={'warning'} />
              )}
            </Box>
          </StyledTooltip>
        </IconButton>
      )}
    </>
  );
}

type CategorizedErrors = {
  directErrors: ValidationError[];
  directWarnings: ValidationError[];
  indirectErrors: ValidationError[];
  indirectWarnings: ValidationError[];
};
