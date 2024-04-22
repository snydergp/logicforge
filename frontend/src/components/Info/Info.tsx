import { styled, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
import HelpIcon from '@mui/icons-material/HelpOutline';

export interface InfoProps {
  text: string;
}

export function Info({ text }: InfoProps) {
  return (
    <>
      <StyledTooltip title={text} placement={'right-start'}>
        <HelpIcon
          sx={(theme) => ({
            width: '0.9rem',
            verticalAlign: 'super',
            color: theme.palette.primary.main,
          })}
        />
      </StyledTooltip>
    </>
  );
}

export const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.default,
    color: theme.typography.body1.color,
    fontSize: theme.typography.htmlFontSize,
    whiteSpace: 'pre-wrap',
    maxWidth: '300px',
  },
}));
