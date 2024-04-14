import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

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
  return (
    <Paper sx={{ mx: 2, my: 1 }}>
      <Box sx={{ mx: 2, my: 1 }}>
        {subtitle && (
          <Typography className={'logicForge-frameSection__subtitle'}>{subtitle}</Typography>
        )}
        <Typography
          className={'logicForge-frameSection__title'}
          sx={{ fontWeight: 700, fontSize: '1.15rem' }}
        >
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}
