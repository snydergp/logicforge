import {
  ContentKey,
  ContentType,
  ReferenceContent,
  TypeIntersection,
  VariableContent,
} from '../../types';
import { useContent } from '../../hooks/useContent';
import { useSelector } from 'react-redux';
import { selectEngineSpec } from '../../redux/slices/frameEditorSlice';
import React, { useMemo } from 'react';
import { useTranslate } from '../I18n/I18n';
import { typePropertyTitleKey } from '../../util';
import { Box, Typography } from '@mui/material';
import { TypeView } from '../TypeView/TypeView';

export interface ReferencePathViewProps {
  contentKey: ContentKey;
}

export function ReferencePathView({ contentKey }: ReferencePathViewProps) {
  const content = useContent<ReferenceContent>(contentKey, ContentType.REFERENCE);
  const { optional, type, multi } = useContent<VariableContent>(
    content.variableKey,
    ContentType.VARIABLE,
  );
  const { types } = useSelector(selectEngineSpec);

  const translate = useTranslate();

  const { path } = content;
  const segmentModels = useMemo<SegmentModel[]>(() => {
    return path.reduce((collected, propertyName) => {
      const parentModel =
        collected.length === 0
          ? {
              type,
              multi,
              optional,
            }
          : collected[collected.length - 1];
      if (parentModel.type.length !== 1) {
        // we cannot use properties on intersection types
        throw new Error(
          `Path ${path.join('/')} on root type ${type.join(
            '|',
          )} is invalid due to a type intersection at property ${propertyName}`,
        );
      }
      const [typeId] = parentModel.type;
      const { properties } = types[typeId];
      const propertySpec = properties[propertyName];
      if (propertySpec === undefined) {
        throw new Error(
          `Path ${path.join('/')} on root type ${type.join(
            '|',
          )} is invalid due to a missing property, ${propertyName}, on parent type ${typeId}`,
        );
      }
      collected.push({
        propertyName,
        propertyLabel: translate(typePropertyTitleKey(typeId, propertyName)),
        type: propertySpec.type,
        multi: propertySpec.multi || parentModel.multi,
        optional: propertySpec.optional || parentModel.optional,
      });
      return collected;
    }, [] as SegmentModel[]);
  }, [path, type, multi, optional, types, translate]);

  return (
    <Box sx={{ width: '100%' }}>
      <SegmentTree segmentModels={segmentModels} index={0} />
    </Box>
  );
}

interface SegmentTreeProps {
  segmentModels: SegmentModel[];
  index: number;
}

function SegmentTree({ segmentModels, index }: SegmentTreeProps) {
  if (index === segmentModels.length) {
    return null;
  }
  const { propertyLabel, type, multi, optional } = segmentModels[index];
  const segmentView = (
    <Typography variant={'body2'} color={(theme) => theme.palette.text.secondary}>
      &#x2514;&nbsp;{propertyLabel}&nbsp; (<TypeView {...{ type, multi, optional }} />)
    </Typography>
  );
  return (
    <>
      {segmentView}
      <Box sx={{ ml: '15px' }}>
        <SegmentTree {...{ segmentModels }} index={index + 1} />
      </Box>
    </>
  );
}

type SegmentModel = {
  propertyName: string;
  propertyLabel: string;
  type: TypeIntersection;
  multi: boolean;
  optional: boolean;
};
