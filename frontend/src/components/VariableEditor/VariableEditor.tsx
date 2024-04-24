import { ContentKey, ContentType, VariableContent } from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import { selectContentByKey, updateVariable } from '../../redux/slices/editors';
import { FrameSection } from '../FrameSection/FrameSection';
import { useTranslate } from '../I18n/I18n';
import { labelKey } from '../../util';
import React, { ChangeEvent, useCallback } from 'react';
import { Box, FormControl, TextField, Typography } from '@mui/material';
import { TypeView } from '../TypeView/TypeView';

export interface VariableEditorProps {
  contentKey: ContentKey;
}

export function VariableEditor({ contentKey }: VariableEditorProps) {
  const translate = useTranslate();
  const dispatch = useDispatch();

  const content = useSelector(selectContentByKey(contentKey));
  if (content === undefined) {
    throw new Error(`Missing content ${contentKey}`);
  }
  if (content.differentiator !== ContentType.VARIABLE) {
    throw new Error(`Unexpected content type: ${content.differentiator}`);
  }
  const variableContent = content as VariableContent;

  const title = translate(labelKey('variable-output'));
  const infoText = translate(labelKey('variable-editor-info'));

  const titleLabel = translate(labelKey('title'));
  const descriptionLabel = translate(labelKey('description'));

  const handleTitleUpdate = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      dispatch(updateVariable(contentKey, event.target.value, variableContent.description));
    },
    [dispatch, contentKey, variableContent.description],
  );

  const handleDescriptionUpdate = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      dispatch(updateVariable(contentKey, variableContent.title, event.target.value));
    },
    [dispatch, contentKey, variableContent.title],
  );

  return (
    <FrameSection title={title} subtitle={<TypeView type={variableContent.type} />}>
      <Box sx={{ mx: 2, mb: 3 }}>
        <Typography variant={'body2'}>{infoText}</Typography>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <TextField
            variant={'standard'}
            value={variableContent.title}
            label={titleLabel}
            onChange={handleTitleUpdate}
          />
          <TextField
            variant={'standard'}
            value={variableContent.description}
            label={descriptionLabel}
            onChange={handleDescriptionUpdate}
          />
        </FormControl>
      </Box>
    </FrameSection>
  );
}
