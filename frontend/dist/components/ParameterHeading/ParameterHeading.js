import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Typography } from '@mui/material';
import { Info } from '../Info/Info';
export function ParameterHeading({ title, description, subtitle }) {
    return (_jsxs("div", Object.assign({ className: 'logicforgeParameterHeading' }, { children: [_jsxs(Typography, Object.assign({ variant: 'h5', className: 'logicforgeParameterHeading__title', fontSize: '1.12rem' }, { children: [title, description !== undefined && _jsx(Info, { text: description })] })), subtitle !== undefined && (_jsx(Typography, Object.assign({ variant: 'h6', className: 'logicforgeParameterHeading__subtitle', fontSize: '.9rem', style: { fontVariant: 'all-small-caps' } }, { children: subtitle })))] })));
}
