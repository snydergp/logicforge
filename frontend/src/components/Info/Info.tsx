import { Tooltip } from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import './Info.scss';

export interface InfoProps {
  text: string;
}

export function Info({ text }: InfoProps) {
  return (
    <span className={'logicforgeInfo'}>
      <Tooltip title={text}>
        <HelpIcon sx={{ width: '0.9rem' }} />
      </Tooltip>
    </span>
  );
}
