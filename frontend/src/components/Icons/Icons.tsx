import ProcessIcon from '@mui/icons-material/Checklist';
import ActionIcon from '@mui/icons-material/DirectionsRun';
import FunctionIcon from '@mui/icons-material/Functions';
import TextIcon from '@mui/icons-material/Abc';
import NumberIcon from '@mui/icons-material/Numbers';
import BooleanIcon from '@mui/icons-material/Iso';
import ConditionalIcon from '@mui/icons-material/CallSplit';
import ResultIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import { createSvgIcon } from '@mui/material';

const style = '.var {font: italic 40px serif;fill: currentColor}';
const VariableIcon = createSvgIcon(
  <>
    <style>{style}</style>

    <text
      x="15"
      y="15"
      text-anchor="middle"
      alignment-baseline="middle"
      dominant-baseline="middle"
      className="var"
    >
      x&nbsp;
    </text>
  </>,
  'VariableIcon',
);

export {
  ProcessIcon,
  ActionIcon,
  FunctionIcon,
  TextIcon,
  NumberIcon,
  BooleanIcon,
  VariableIcon,
  ResultIcon,
  ConditionalIcon,
};
