import { useTranslate } from 'react-polyglot';
import { label, typeTitlePath } from '../../util';
import { Container, Stack, Typography } from '@mui/material';
import { Info } from '../Info/Info';
import React from 'react';

export interface VariableDisplayProps {
  typeId: string;
  optional: boolean;
  initial?: boolean;
  title: string;
  description?: string;
}

export function VariableDisplay({
  typeId,
  optional,
  initial = false,
  title,
  description,
}: VariableDisplayProps) {
  const translate = useTranslate();

  const superTitleMain = translate(label(initial ? 'initial-variable' : 'variable'));
  const optionalLabel = optional ? label('optional') + ' ' : '';
  const superTitleType = translate(typeTitlePath(typeId));
  const superTitle = (
    <Container>
      <Typography>{superTitleMain}</Typography>&nbsp;
      <Typography>
        ({optionalLabel} {superTitleType})
      </Typography>
    </Container>
  );
  const mainTitle = (
    <Container>
      <Typography>
        {title}
        {description !== undefined && <Info text={description} />}
      </Typography>
    </Container>
  );

  return (
    <Stack direction={'column'}>
      {superTitle}
      {mainTitle}
    </Stack>
  );
}
