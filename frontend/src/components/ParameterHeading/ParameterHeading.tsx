import { Typography } from '@mui/material';
import { Info } from '../Info/Info';

export interface ParameterHeadingProps {
  title: string;
  description?: string;
  subtitle?: string;
}

export function ParameterHeading({ title, description, subtitle }: ParameterHeadingProps) {
  return (
    <div className={'logicforgeParameterHeading'}>
      <Typography
        variant={'h5'}
        className={'logicforgeParameterHeading__title'}
        fontSize={'1.12rem'}
      >
        {title}
        {description !== undefined && <Info text={description} />}
      </Typography>
      {subtitle !== undefined && (
        <Typography
          variant={'h6'}
          className={'logicforgeParameterHeading__subtitle'}
          fontSize={'.9rem'}
          style={{ fontVariant: 'all-small-caps' }}
        >
          {subtitle}
        </Typography>
      )}
    </div>
  );
}
