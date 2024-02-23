import {
  ALWAYS_VALID,
  BOOLEAN_STRING,
  DECIMAL_STRING,
  EngineSpec,
  FunctionSpec,
  INTEGER_STRING,
  LONG_STRING,
  InputSpec,
  TypeSpec,
  Validator,
  ValueContent,
} from '../../types';
import { WellKnownType } from '../../constant/well-known-type';
import { Autocomplete, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { EditorContext, EditorInfo } from '../FrameEditor/FrameEditor';
import { useDispatch } from 'react-redux';
import { setFunction } from '../../redux/slices/editors';
import { useTranslate } from 'react-polyglot';
import {
  collectSubtypes,
  functionTitlePath,
  typeEnumValueTitlePath,
  TypeInfo,
  typeTitlePath,
} from '../../util';
import { Simulate } from 'react-dom/test-utils';
import error = Simulate.error;

export interface ValueEditorProps {
  parameterSpec: InputSpec;
  content: ValueContent;
}

function validatorForSpec(parameterSpec: InputSpec): Validator {
  const returnType = parameterSpec.returnType;
  const wellKnownType = returnType as WellKnownType;
  if (Object.values(WellKnownType).includes(wellKnownType)) {
    switch (wellKnownType) {
      case WellKnownType.BOOLEAN:
        return BOOLEAN_STRING;
      case WellKnownType.INTEGER:
        return INTEGER_STRING;
      case WellKnownType.LONG:
        return LONG_STRING;
      case WellKnownType.FLOAT:
      case WellKnownType.DOUBLE:
        // all decimal values can be inputted, but precision will ultimately be limited by the underlying datatype
        return DECIMAL_STRING;
    }
  }
  return ALWAYS_VALID;
}

interface Option {
  id: string;
  label: string;
  groupId?: string;
}

// Mode will determine whether/how options are rendered
// - PRIMITIVE: free entry with options for function/variable
//   "Type to enter a value, or ..."
//   Apply validation appropriate to type
// - ENUMERATION: forced selection with options for function variable
//   "Select a value, or ..."

enum Mode {
  LITERAL = 'LITERAL',
  FUNCTION = 'FUNCTION',
  VARIABLE = 'VARIABLE',
}

const ENUM_GROUP_ID = 'logicforge.enum';
const NON_LITERAL_GROUP_ID = 'logicforge.non-literal';
const LITERAL_GROUP_ID = 'logicforge.literal';
const LITERAL_OPTION_ID = 'logicforge.use-literal';
const FUNCTION_OPTION_ID = 'logicforge.use-function';
const VARIABLE_OPTION_ID = 'logicforge.use-variable';

const USE_FUNCTION_OPTION: Option = {
  id: FUNCTION_OPTION_ID,
  label: 'Call a function', // TODO translation
  groupId: NON_LITERAL_GROUP_ID,
};
const USE_VARIABLE_OPTION: Option = {
  id: VARIABLE_OPTION_ID,
  label: 'Reference a variable', // TODO translation
  groupId: NON_LITERAL_GROUP_ID,
};
const USE_LITERAL_OPTION: Option = {
  id: LITERAL_OPTION_ID,
  label: 'Enter a literal value', // TODO translation
  groupId: NON_LITERAL_GROUP_ID,
};

function buildLiteralOptions(typeSpec: TypeSpec, translate: (keyof: string) => string): Option[] {
  const defaultLiteralSelections = [USE_FUNCTION_OPTION, USE_VARIABLE_OPTION];
  if (typeSpec.values && typeSpec.values.length > 0) {
    return [
      ...typeSpec.values.map((value) => {
        return {
          id: value,
          label: translate(typeEnumValueTitlePath(typeSpec.id, value)),
          groupId: ENUM_GROUP_ID,
        } as Option;
      }),
      ...defaultLiteralSelections,
    ];
  } else {
    return [USE_FUNCTION_OPTION, USE_VARIABLE_OPTION];
  }
}

function buildFunctionOptions(
  functionSpecs: { [key: string]: FunctionSpec },
  translateFunction: (key: string) => string,
): Option[] {
  return [
    ...Object.entries(functionSpecs).map(([key, value]) => {
      return {
        id: key,
        label: translateFunction(functionTitlePath(key)),
      } as Option;
    }),
    ...[USE_LITERAL_OPTION],
  ];
}

function buildVariableOptions(): Option[] {
  // TODO
  return [USE_LITERAL_OPTION];
}

function findFunctionsMatchingTypeId(
  engineSpec: EngineSpec,
  typeMapping: { [key: string]: TypeInfo },
  typeId: string,
) {
  const matchingFunctions: { [key: string]: FunctionSpec } = {};
  if (typeMapping !== undefined && engineSpec !== undefined) {
    const subtypes = collectSubtypes(typeId, typeMapping);
    Object.entries(engineSpec.functions).forEach(([key, value]) => {
      if (subtypes[value.outputType] !== undefined) {
        matchingFunctions[key] = value;
      }
    });
  }
  return matchingFunctions;
}

export function ValueEditor({ parameterSpec, content }: ValueEditorProps) {
  const dispatch = useDispatch();

  const translateFunction = useTranslate() as (key: string) => string;

  const [validator, setValidator] = useState<Validator>(ALWAYS_VALID);

  const [value, setValue] = useState(content.value);
  const { engineSpec, typeMappings } = useContext(EditorContext) as EditorInfo;

  const [mode, setMode] = useState(Mode.LITERAL);

  const [errors, setErrors] = useState<string[] | undefined>();

  const returnType = parameterSpec.returnType;
  const typeSpec = engineSpec.types[returnType];
  const enumerated = typeSpec.values && typeSpec.values.length > 0;

  const functionSpecs = findFunctionsMatchingTypeId(engineSpec, typeMappings, returnType);
  // TODO select usable variables

  const optionsMap = {
    [Mode.LITERAL]: buildLiteralOptions(typeSpec, translateFunction),
    [Mode.FUNCTION]: buildFunctionOptions(functionSpecs, translateFunction),
    [Mode.VARIABLE]: buildVariableOptions(),
  };

  const [inputValue, setInputValue] = useState(value);

  const [options, setOptions] = useState<readonly Option[]>([
    {
      id: FUNCTION_OPTION_ID,
      label: 'FUNCTION',
    },
  ]);

  const [shortcutMode, setShortcutMode] = useState(false);

  const handleChange = useCallback(
    (value: string | Option | null) => {
      if (typeof value !== 'string' && value !== null) {
        const option: Option = value;
        const id = option.id;
        if (mode === Mode.LITERAL) {
          if (id === FUNCTION_OPTION_ID) {
            setMode(Mode.FUNCTION);
          } else if (id === VARIABLE_OPTION_ID) {
            setMode(Mode.VARIABLE);
          }
        } else if (mode === Mode.FUNCTION) {
          if (id === LITERAL_OPTION_ID) {
            setMode(Mode.LITERAL);
          } else {
            // use the selected function
            dispatch(setFunction(id, content.key));
          }
        } else if (mode === Mode.VARIABLE) {
          if (id === LITERAL_OPTION_ID) {
            setMode(Mode.LITERAL);
          }
        }
        setShortcutMode(false);
        setInputValue('');
      }
    },
    [mode, setMode, setShortcutMode, setInputValue, dispatch],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      let updatedShortcutMode = false;

      // enter shortcut modes
      if (mode === Mode.LITERAL && !shortcutMode) {
        if (value === '=') {
          setMode(Mode.FUNCTION);
          setShortcutMode(true);
          updatedShortcutMode = true;
        } else if (value === '$') {
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
        setErrors(validator.validate(value));
      }
    },
    [mode, setMode, shortcutMode, setShortcutMode, setInputValue, setErrors, validator],
  );

  const handleInputBlur = useCallback(() => {
    setErrors(validator.validate(inputValue));
  }, [inputValue, setErrors, validator]);

  const handleKeyDown = useCallback(
    (key: string) => {
      if (
        mode !== Mode.LITERAL &&
        shortcutMode &&
        inputValue === '' &&
        (key === 'Backspace' || key === 'Escape')
      ) {
        setMode(Mode.LITERAL);
        setShortcutMode(false);
        setInputValue('');
      }
    },
    [mode, setMode, shortcutMode, setShortcutMode, inputValue, setInputValue],
  );

  const [freeSolo, setFreeSolo] = useState(!enumerated);
  const [label, setLabel] = useState(mode as string);

  useEffect(() => {
    setLabel(mode);
    setOptions(optionsMap[mode]);
  }, [mode, setLabel, setOptions]);

  useEffect(() => {
    setValidator(validatorForSpec(parameterSpec));
  }, [parameterSpec, setValidator]);

  return (
    <Autocomplete
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant={'standard'}
          error={errors !== undefined && errors.length > 0}
          helperText={errors !== undefined && errors.length > 0 ? errors.join(', ') : null}
          onBlur={handleInputBlur}
          InputProps={{
            ...params.InputProps,
            type: 'search',
          }}
        />
      )}
      disableClearable
      freeSolo={freeSolo}
      options={options}
      onChange={(event, value) => {
        handleChange(value);
      }}
      onInputChange={(event, value, reason) => {
        handleInputChange(value);
      }}
      onKeyDown={(event) => {
        handleKeyDown(event.key);
      }}
      fullWidth={true}
      value={value}
      inputValue={inputValue}
    />
  );
}
