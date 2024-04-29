import { labelKey } from '../../util';
import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import { useTranslate } from '../I18n/I18n';
import { VariableIcon } from '../Icons/Icons';
import { ContentKey, ContentType, VariableContent } from '../../types';
import { TypeView } from '../TypeView/TypeView';
import { useContent } from '../../hooks/useContent';
import { StyledTooltip } from '../Info/Info';

export interface VariableViewProps {
  contentKey: ContentKey;
}

export function VariableView({ contentKey }: VariableViewProps) {
  const { type, multi, optional, title, initial, referenceKeys } = useContent<VariableContent>(
    contentKey,
    ContentType.VARIABLE,
  );
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

  const referenceCount = referenceKeys.length;
  const referenceCountLabel =
    referenceCount === 1
      ? translate(labelKey('reference-count-single'))
      : translate(labelKey('reference-count-multi'), { count: referenceCount.toString() });

  return (
    <StyledTooltip title={referenceCountLabel}>
      <Stack direction={'row'} sx={{ mt: 1, width: '100%' }}>
        <VariableIcon />
        <Box sx={{ width: '100%', p: 0, mb: 1, ml: 1 }}>
          {superTitle}
          {mainTitle}
        </Box>
      </Stack>
    </StyledTooltip>
  );
}
