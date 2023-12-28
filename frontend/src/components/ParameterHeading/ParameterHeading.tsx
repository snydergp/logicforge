import { Tooltip, Typography } from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import './ParameterHeading.scss';
import { Info } from '../Info/Info';

export interface ParameterHeadingProps {
  title: string;
  description?: string;
  subtitle?: string;
}

export function ParameterHeading({ title, description, subtitle }: ParameterHeadingProps) {
  return (
    <div className={'logicforgeParameterHeading'}>
      <Typography variant={'h5'} className={'logicforgeParameterHeading__title'}>
        {title}
        {description !== undefined && <Info text={description} />}
      </Typography>
      {subtitle !== undefined && (
        <Typography variant={'h6'} className={'logicforgeParameterHeading__subtitle'}>
          {subtitle}
        </Typography>
      )}
    </div>
  );
}
