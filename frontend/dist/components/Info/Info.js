import { jsx as _jsx } from "react/jsx-runtime";
import { Tooltip } from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import './Info.scss';
export function Info({ text }) {
    return (_jsx("span", Object.assign({ className: 'logicforgeInfo' }, { children: _jsx(Tooltip, Object.assign({ title: text }, { children: _jsx(HelpIcon, { sx: { width: '0.9rem' } }) })) })));
}
