import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Tooltip } from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
export function Info({ text }) {
    return (_jsx(_Fragment, { children: _jsx(Tooltip, Object.assign({ title: text }, { children: _jsx(HelpIcon, { sx: { width: '0.9rem', verticalAlign: 'super' } }) })) }));
}
