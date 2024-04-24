import { labelKey } from '../../util';
import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import { useTranslate } from '../I18n/I18n';
import { VariableIcon } from '../Icons/Icons';
import { TypeIntersection } from '../../types';
import { TypeView } from '../TypeView/TypeView';

export interface VariableViewProps {
  type: TypeIntersection;
  multi: boolean;
  optional: boolean;
  initial?: boolean;
  title: string;
  description?: string;
}

export function VariableView({ type, multi, optional, initial = false, title }: VariableViewProps) {
  const translate = useTranslate();

  const superTitleMain = translate(labelKey(initial ? 'initial-variable' : 'sets-variable'));
  const superTitle = (
    <Typography variant={'body2'} sx={{ width: '100%' }}>
      {superTitleMain}&nbsp;
      <TypeView {...{ type, multi, optional }} />
    </Typography>
  );
  const mainTitle = (
    <Typography variant={'body2'} color={(theme) => theme.palette.text.secondary}>
      <span>{title || translate(labelKey('unnamed-variable'))}</span>
    </Typography>
  );

  return (
    <Stack direction={'row'} sx={{ mt: 1, width: '100%' }}>
      <VariableIcon />
      <Box sx={{ width: '100%', p: 0, mb: 1, ml: 1 }}>
        {superTitle}
        {mainTitle}
      </Box>
    </Stack>
  );
}
