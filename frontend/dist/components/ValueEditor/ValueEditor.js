import { jsx as _jsx } from "react/jsx-runtime";
import { WellKnownType } from '../../constant/well-known-type';
import { Autocomplete, TextField } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { EditorContext } from '../FrameEditor/FrameEditor';
import { useDispatch } from 'react-redux';
import { setFunction } from '../../redux/slices/editors';
import { useTranslate } from 'react-polyglot';
import { collectSubtypes, functionTitlePath, typeTitlePath } from '../../util';
function validatorForSpec(parameterSpec) {
    const returnType = parameterSpec.returnType;
    if (returnType in WellKnownType) {
        const wellKnownType = returnType;
        switch (wellKnownType) {
            case WellKnownType.OBJECT:
                break;
            case WellKnownType.STRING:
                break;
            case WellKnownType.BOOLEAN:
                break;
            case WellKnownType.INTEGER:
                break;
            case WellKnownType.LONG:
                break;
            case WellKnownType.FLOAT:
                break;
            case WellKnownType.DECIMAL:
                break;
        }
    }
}
// Mode will determine whether/how options are rendered
// - PRIMITIVE: free entry with options for function/variable
//   "Type to enter a value, or ..."
//   Apply validation appropriate to type
// - ENUMERATION: forced selection with options for function variable
//   "Select a value, or ..."
var Mode;
(function (Mode) {
    Mode["LITERAL"] = "LITERAL";
    Mode["FUNCTION"] = "FUNCTION";
    Mode["VARIABLE"] = "VARIABLE";
})(Mode || (Mode = {}));
const ENUM_GROUP_ID = 'logicforge.enum';
const NON_LITERAL_GROUP_ID = 'logicforge.non-literal';
const LITERAL_GROUP_ID = 'logicforge.literal';
const LITERAL_OPTION_ID = 'logicforge.use-literal';
const FUNCTION_OPTION_ID = 'logicforge.use-function';
const VARIABLE_OPTION_ID = 'logicforge.use-variable';
const USE_FUNCTION_OPTION = {
    id: FUNCTION_OPTION_ID,
    label: 'Call a function',
    groupId: NON_LITERAL_GROUP_ID,
};
const USE_VARIABLE_OPTION = {
    id: VARIABLE_OPTION_ID,
    label: 'Reference a variable',
    groupId: NON_LITERAL_GROUP_ID,
};
const USE_LITERAL_OPTION = {
    id: LITERAL_OPTION_ID,
    label: 'Enter a literal value',
    groupId: NON_LITERAL_GROUP_ID,
};
function buildLiteralOptions(parameterSpec, typeSpec) {
    if (typeSpec.values !== undefined && typeSpec.values.length > 0) {
        // TODO Enum mode
    }
    else {
        // TODO Free text mode
    }
    return [USE_FUNCTION_OPTION, USE_VARIABLE_OPTION];
}
function buildFunctionOptions(functionSpecs, translateFunction) {
    return [
        ...Object.entries(functionSpecs).map(([key, value]) => {
            return {
                id: key,
                label: translateFunction(functionTitlePath(key)),
            };
        }),
        ...[USE_LITERAL_OPTION],
    ];
}
function buildVariableOptions() {
    // TODO
    return [USE_LITERAL_OPTION];
}
function findFunctionsMatchingTypeId(engineSpec, typeMapping, typeId) {
    const matchingFunctions = {};
    if (typeMapping !== undefined && engineSpec !== undefined) {
        const subtypes = collectSubtypes(typeId, typeMapping);
        Object.entries(engineSpec.functions).forEach(([key, value]) => {
            if (subtypes[value.returnType] !== undefined) {
                matchingFunctions[key] = value;
            }
        });
    }
    return matchingFunctions;
}
export function ValueEditor({ parameterSpec, content }) {
    const dispatch = useDispatch();
    const translateFunction = useTranslate();
    const [value, setValue] = useState(content.value);
    const { editorId, engineSpec, typeMappings } = useContext(EditorContext);
    const [mode, setMode] = useState(Mode.LITERAL);
    const returnType = parameterSpec.returnType;
    const typeSpec = engineSpec.types[returnType];
    const enumerated = typeSpec.values !== undefined && typeSpec.values.length > 0;
    const functionSpecs = findFunctionsMatchingTypeId(engineSpec, typeMappings, returnType);
    // TODO select usable variables
    const optionsMap = {
        [Mode.LITERAL]: buildLiteralOptions(parameterSpec, typeSpec),
        [Mode.FUNCTION]: buildFunctionOptions(functionSpecs, translateFunction),
        [Mode.VARIABLE]: buildVariableOptions(),
    };
    const [inputValue, setInputValue] = useState(value);
    const [options, setOptions] = useState([
        {
            id: FUNCTION_OPTION_ID,
            label: 'FUNCTION',
        },
    ]);
    const [shortcutMode, setShortcutMode] = useState(false);
    function handleChange(value) {
        if (typeof value !== 'string' && value !== null) {
            const option = value;
            const id = option.id;
            if (mode === Mode.LITERAL) {
                if (id === FUNCTION_OPTION_ID) {
                    setMode(Mode.FUNCTION);
                }
                else if (id === VARIABLE_OPTION_ID) {
                    setMode(Mode.VARIABLE);
                }
            }
            else if (mode === Mode.FUNCTION) {
                if (id === LITERAL_OPTION_ID) {
                    setMode(Mode.LITERAL);
                }
                else {
                    // use the selected function
                    dispatch(setFunction(id, editorId, content.key));
                }
            }
            else if (mode === Mode.VARIABLE) {
                if (id === LITERAL_OPTION_ID) {
                    setMode(Mode.LITERAL);
                }
            }
            setShortcutMode(false);
            setInputValue('');
        }
    }
    function handleInputChange(value) {
        // FUTURE: the shortcut characters currently remain in the input literal. consider shifting them out of the actual
        //  input text into a UI display to the immediate left of the input. This would also require handling a backspace
        //  key press when the input is empty to cancel shortcut mode
        let updatedShortcutMode = false;
        // enter shortcut modes
        if (mode === Mode.LITERAL && !shortcutMode) {
            if (value === '=') {
                setMode(Mode.FUNCTION);
                setShortcutMode(true);
                updatedShortcutMode = true;
            }
            else if (value === '$') {
                setMode(Mode.VARIABLE);
                setShortcutMode(true);
                updatedShortcutMode = true;
            }
        }
        // exit shortcut modes
        if (shortcutMode && value === '') {
            setMode(Mode.LITERAL);
            setShortcutMode(false);
            updatedShortcutMode = true;
        }
        if (!updatedShortcutMode) {
            // update input value
            setInputValue(value);
        }
    }
    function handleKeyDown(key) {
        if (mode !== Mode.LITERAL &&
            shortcutMode &&
            inputValue === '' &&
            (key === 'Backspace' || key === 'Escape')) {
            setMode(Mode.LITERAL);
            setShortcutMode(false);
            setInputValue('');
        }
    }
    const [freeSolo, setFreeSolo] = useState(!enumerated);
    const [label, setLabel] = useState(mode);
    useEffect(() => {
        setLabel(mode);
        setOptions(optionsMap[mode]);
        // TODO set/remove validators
    }, [mode]);
    return (_jsx(Autocomplete, { renderInput: (params) => (_jsx(TextField, Object.assign({}, params, { label: translateFunction(typeTitlePath(returnType)), variant: 'standard', InputProps: Object.assign(Object.assign({}, params.InputProps), { type: 'search' }) }))), disableClearable: true, freeSolo: freeSolo, options: options, onChange: (event, value) => {
            handleChange(value);
        }, onInputChange: (event, value, reason) => {
            handleInputChange(value);
        }, onKeyDown: (event) => {
            handleKeyDown(event.key);
        }, fullWidth: true, value: value, inputValue: inputValue }));
}
