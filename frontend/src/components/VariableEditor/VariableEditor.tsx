import { ContentKey, ContentType, VariableContent } from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import { selectContentByKey, updateVariable } from '../../redux/slices/editors';
import { FrameSection } from '../FrameSection/FrameSection';
import { useTranslate } from '../I18n/I18n';
import { labelKey, typeTitleKey } from '../../util';
import React, { ChangeEvent, useCallback } from 'react';
import { Box, FormControl, Stack, TextField, Typography } from '@mui/material';

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
  if (content.type !== ContentType.VARIABLE) {
    throw new Error(`Unexpected content type: ${content.type}`);
  }
  const variableContent = content as VariableContent;

  const title = translate(labelKey('variable-output'));
  const typeLabel = translate(labelKey('type-label'));
  const type = translate(typeTitleKey(variableContent.typeId as string));
  const infoText = translate(labelKey('variable-editor-info'));

  const titleLabel = translate(labelKey('title'));
  const descriptionLabel = translate(labelKey('description'));

  const handleTitleUpdate = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      dispatch(updateVariable(contentKey, event.target.value, variableContent.description));
    },
    [dispatch, content],
  );

  const handleDescriptionUpdate = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      dispatch(updateVariable(contentKey, variableContent.title, event.target.value));
    },
    [dispatch, content],
  );

  return (
    <FrameSection title={title}>
      <Box sx={{ mx: 2, mb: 3 }}>
        <Stack width={'100%'} direction={'row'} sx={{ mb: 2 }}>
          <Box sx={{ mr: 2 }}>
            <Typography variant={'body1'}>{typeLabel}</Typography>
          </Box>
          <Box>
            <Typography variant={'body1'} fontWeight={'700'} fontStyle={'italic'}>
              {type}
            </Typography>
          </Box>
        </Stack>
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
