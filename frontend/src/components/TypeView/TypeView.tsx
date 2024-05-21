import { TypeUnion } from '../../types';
import { useTranslate } from '../I18n/I18n';
import { Typography, useTheme } from '@mui/material';
import { labelKey, typeTitleKey } from '../../util';

export interface TypeViewProps {
  type: TypeUnion;
  multi?: boolean;
  optional?: boolean;
}

export function TypeView({ type, multi, optional }: TypeViewProps) {
  const translate = useTranslate();
  const theme = useTheme();
  const orLabel = translate(labelKey('or'));

  return (
    <>
      {optional && (
        <Typography
          key="optional"
          component={'span'}
          variant={'body2'}
          sx={{
            fontVariant: 'all-small-caps',
            lineHeight: 1,
          }}
        >
          {translate(labelKey('optional'))}&nbsp;
        </Typography>
      )}
      {multi && (
        <Typography
          key="multiple"
          component={'span'}
          variant={'body2'}
          sx={{
            fontVariant: 'all-small-caps',
            lineHeight: 1,
          }}
        >
          {translate(labelKey('multiple'))}&nbsp;
        </Typography>
      )}
      {type.map((typeId, index) => {
        const label = translate(typeTitleKey(typeId));

        return (
          <span key={index}>
            {index !== 0 && (
              <Typography
                key={`or-${index}`}
                component={'span'}
                variant={'body2'}
                sx={{
                  fontVariant: 'all-small-caps',
                  lineHeight: 1,
                }}
              >
                &nbsp;{orLabel}&nbsp;
              </Typography>
            )}
            <Typography
              key={`type-${index}`}
              component={'span'}
              variant={'body2'}
              sx={{
                color: theme.palette.text.secondary,
                fontVariant: 'all-small-caps',
                lineHeight: 1,
              }}
            >
              {label}
            </Typography>
          </span>
        );
      })}
    </>
  );
}
