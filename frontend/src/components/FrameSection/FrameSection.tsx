import React from 'react';
import { Box, darken, lighten, Typography, useTheme } from '@mui/material';
import { Info } from '../Info/Info';

export interface FrameSectionProps {
  title: string;
  description?: string;
  subtitle?: string;
}

export function FrameSection({
  title,
  description,
  subtitle,
  children,
}: React.PropsWithChildren<FrameSectionProps>) {
  const theme = useTheme();

  const baseColor = theme.palette.background.paper;
  const coefficient = 0.15;
  const backgroundColor =
    theme.palette.mode === 'light'
      ? darken(baseColor, coefficient)
      : lighten(baseColor, coefficient);
  const borderRadius = '0.4rem';
  return (
    <Box sx={{ mx: 2, my: 1, backgroundColor, borderRadius }}>
      <Box sx={{ mx: 2, my: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
          {title}
          {description !== undefined && <Info text={description} />}
        </Typography>
        {subtitle && (
          <Typography
            fontSize={theme.typography.body2.fontSize}
            lineHeight={1}
            color={theme.palette.text.secondary}
            sx={{ fontVariant: 'all-small-caps' }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
}
