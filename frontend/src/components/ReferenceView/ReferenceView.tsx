import {
  ContentKey,
  ContentType,
  ExpressionInfo,
  ReferenceContent,
  VariableContent,
} from '../../types';
import { useContent } from '../../hooks/useContent';
import { useTranslate } from '../I18n/I18n';
import { labelKey } from '../../util';
import { Box, ListItemText, Typography } from '@mui/material';
import { shallowEqual, useSelector } from 'react-redux';
import { selectReferenceExpressionType } from '../../redux/slices/editor';
import { TypeView } from '../TypeView/TypeView';
import { LogicForgeReduxState } from '../../redux';

export interface ReferenceViewProps {
  contentKey: ContentKey;
}

export function ReferenceView({ contentKey }: ReferenceViewProps) {
  const translate = useTranslate();

  const referenceContent = useContent<ReferenceContent>(contentKey, ContentType.REFERENCE);
  const variableContent = useContent<VariableContent>(
    referenceContent.variableKey,
    ContentType.VARIABLE,
  );
  const referenceInfo = useSelector<LogicForgeReduxState, ExpressionInfo>(
    selectReferenceExpressionType(contentKey),
    shallowEqual,
  );

  const primaryLabel = (
    <Typography
      sx={(theme) => ({
        color: theme.palette.text.primary,
        fontSize: theme.typography.body2.fontSize,
      })}
    >
      {translate(labelKey('use-variable'))}&nbsp;
      <TypeView {...referenceInfo} />
    </Typography>
  );

  const varTitle =
    variableContent.title || variableContent.translationKey
      ? translate(`${variableContent.translationKey}.title`)
      : translate(labelKey('unnamed-variable'));

  const secondaryLabel = (
    <Typography
      sx={(theme) => ({
        color: theme.palette.text.secondary,
        fontSize: theme.typography.body2.fontSize,
      })}
    >
      {varTitle}&nbsp; (
      <TypeView {...variableContent} />)
    </Typography>
  );

  return (
    <Box sx={{ ml: 1, width: '100%' }}>
      <ListItemText primary={primaryLabel} secondary={secondaryLabel} />
    </Box>
  );
}
