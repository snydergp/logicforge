import { TypeIntersection } from '../../types';
import { useTranslate } from '../I18n/I18n';
import { Typography, useTheme } from '@mui/material';
import { labelKey, typeTitleKey } from '../../util';

export interface TypeViewProps {
  type: TypeIntersection;
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
          <>
            {index !== 0 && (
              <Typography
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
          </>
        );
      })}
    </>
  );
}
