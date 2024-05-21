import ProcessIcon from '@mui/icons-material/Checklist';
import ActionIcon from '@mui/icons-material/DirectionsRun';
import FunctionIcon from '@mui/icons-material/Functions';
import TextIcon from '@mui/icons-material/Abc';
import NumberIcon from '@mui/icons-material/Numbers';
import BooleanIcon from '@mui/icons-material/Iso';
import ConditionalIcon from '@mui/icons-material/CallSplit';
import ResultIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import { alpha, Box, createSvgIcon, useTheme } from '@mui/material';

export function VariableIcon() {
  const theme = useTheme();

  const icon = createSvgIcon(
    <>
      <text
        x="9"
        y="10"
        fill={theme.palette.text.primary}
        fontFamily="serif"
        fontStyle="italic"
        fontSize="30px"
        textAnchor="middle"
        alignmentBaseline="middle"
        dominantBaseline="middle"
      >
        x
      </text>
      <path
        fill={theme.palette.primary.main}
        transform="translate(29, 27) scale(-0.8, 0.8) rotate(270)"
        d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"
        strokeLinecap="round"
      />
    </>,
    'VariableIcon',
  );

  return <Box component={icon}></Box>;
}

export function ReferenceIcon() {
  const theme = useTheme();

  const icon = createSvgIcon(
    <>
      <text
        x="7"
        y="17"
        fill={theme.palette.text.secondary}
        fontFamily="serif"
        fontStyle="italic"
        fontSize="30px"
        textAnchor="middle"
        alignmentBaseline="middle"
        dominantBaseline="middle"
      >
        x
      </text>
      <path
        fill={theme.palette.secondary.main}
        transform="translate(29, 0) scale(.8) rotate(90)"
        d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"
        strokeLinecap="round"
      />
    </>,
    'VariableIcon',
  );

  return <Box component={icon}></Box>;
}

export function DoubleArrowRawSVG() {
  const theme = useTheme();
  const fill = alpha(theme.palette.text.secondary, 0.05);
  return `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="${fill}"><path d="M15.5 5H11l5 7-5 7h4.5l5-7z"/><path d="M8.5 5H4l5 7-5 7h4.5l5-7z"/></svg>`;
}

export function DragIndicator() {
  const theme = useTheme();

  const icon = createSvgIcon(
    <path
      fill={theme.palette.secondary.main}
      d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
    />,
    'DragIndicatorIcon',
  );

  return <Box component={icon}></Box>;
}

export {
  ProcessIcon,
  ActionIcon,
  FunctionIcon,
  TextIcon,
  NumberIcon,
  BooleanIcon,
  ResultIcon,
  AddIcon,
  ConditionalIcon,
};
