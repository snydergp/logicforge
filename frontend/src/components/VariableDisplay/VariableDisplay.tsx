import { labelKey, typeTitleKey } from '../../util';
import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import { useTranslate } from '../I18n/I18n';
import { VariableIcon } from '../Icons/Icons';

export interface VariableDisplayProps {
  typeId: string;
  multi: boolean;
  optional: boolean;
  initial?: boolean;
  title: string;
  description?: string;
}

export function VariableDisplay({
  typeId,
  multi,
  optional,
  initial = false,
  title,
  description,
}: VariableDisplayProps) {
  const translate = useTranslate();

  const superTitleMain = translate(labelKey(initial ? 'initial-variable' : 'sets-variable'));
  const optionalLabel = optional ? labelKey('optional') + ' ' : '';
  const multiLabel = multi ? translate(labelKey('multiple')) + ' ' : '';
  const typeLabel = translate(typeTitleKey(typeId));
  const superTitle = (
    <Typography variant={'body2'} sx={{ width: '100%' }}>
      {superTitleMain}&nbsp;
      <Typography
        component={'span'}
        variant={'body2'}
        display={'inline'}
        color={(theme) => theme.palette.text.secondary}
      >
        ({optionalLabel}
        {multiLabel}
        {typeLabel})
      </Typography>
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
