import { Tooltip } from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';

export interface InfoProps {
  text: string;
}

export function Info({ text }: InfoProps) {
  return (
    <>
      <Tooltip title={text}>
        <HelpIcon sx={{ width: '0.9rem', verticalAlign: 'super' }} />
      </Tooltip>
    </>
  );
}
