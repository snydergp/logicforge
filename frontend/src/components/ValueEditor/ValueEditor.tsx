import { ArgumentContent, TypeSpec, ValueContent } from '../../types';
import {
  Autocomplete,
  AutocompleteRenderGroupParams,
  Box,
  createFilterOptions,
  darken,
  FilterOptionsState,
  FormControl,
  lighten,
  Stack,
  styled,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  convertValueToFunction,
  convertValueToReference,
  selectAvailableVariables,
  selectContentByKey,
  updateValue,
  updateValueType,
  VariableModel,
} from '../../redux/slices/editors';
import {
  functionTitleKey,
  labelKey,
  typeDescriptionKey,
  typeEnumValueTitleKey,
  typeTitleKey,
} from '../../util';
import { useTranslate } from '../I18n/I18n';
import { EditorContext, EditorInfo } from '../FrameEditor/FrameEditor';

export interface ValueEditorProps {
  contentKey: string;
}

interface Option {
  id: string;
  label: string;
  groupId: string;
}

enum Mode {
  LITERAL = 'LITERAL',
  FUNCTION = 'FUNCTION',
  VARIABLE = 'VARIABLE',
}

const ENUM_GROUP_ID = 'logicforge.enum';
const NON_LITERAL_GROUP_ID = 'logicforge.non-literal';
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
          label: translate(typeEnumValueTitleKey(typeSpec.id, value)),
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
  functionIds: string[],
  translateFunction: (key: string) => string,
): Option[] {
  return [
    ...functionIds.map((key) => {
      return {
        id: key,
        groupId: FUNCTION_OPTION_ID,
        label: translateFunction(functionTitleKey(key)),
      } as Option;
    }),
    ...[USE_LITERAL_OPTION],
  ];
}

function buildVariableOptions(
  availableVariable: VariableModel[],
  translateFunction: (key: string) => string,
): Option[] {
  return [
    ...availableVariable.map((model) => {
      return {
        id: model.key,
        groupId: VARIABLE_OPTION_ID,
        label: model.title,
      } as Option;
    }),
    ...[USE_LITERAL_OPTION],
  ];
}

export function ValueEditor({ contentKey }: ValueEditorProps) {
  const { engineSpec } = useContext(EditorContext) as EditorInfo;
  const dispatch = useDispatch();
  const translate = useTranslate();

  const content = useSelector(selectContentByKey(contentKey)) as ValueContent;
  const argumentContent = useSelector(
    selectContentByKey(content.parentKey as string),
  ) as ArgumentContent;
  const availableVariables = useSelector(selectAvailableVariables(contentKey));

  // tracks the input mode, used to show context-dependent options
  const [mode, setMode] = useState(Mode.LITERAL);

  const options = useMemo<Option[]>(() => {
    switch (mode) {
      case Mode.LITERAL:
        const typeId = content.typeId as string;
        const typeSpec = engineSpec.types[typeId];
        return buildLiteralOptions(typeSpec, translate);
      case Mode.FUNCTION:
        return buildFunctionOptions(content.availableFunctionIds, translate);
      case Mode.VARIABLE:
        return buildVariableOptions(availableVariables, translate);
    }
  }, [mode, content, engineSpec, translate]);

  // shortcut mode allows users to move between modes via keypress.
  //  - Enter FUNCTION from LITERAL by typing '=' when input is empty
  //  - Enter VARIABLE from LITERAL by typing '$' when input in empty
  //  - Return to LITERAL mode by hitting BACKSPACE when input is empty
  const [shortcutMode, setShortcutMode] = useState(false);

  const [open, setOpen] = useState(false);
  const handleFocus = useCallback(() => {
    setOpen(true);
  }, [setOpen]);
  const handleBlur = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const fixedOptions = useMemo<boolean>(() => {
    if (mode !== Mode.LITERAL) {
      return false;
    } else {
      const typeId = content.typeId as string;
      const typeSpec = engineSpec.types[typeId];
      return typeSpec.values !== undefined && typeSpec.values.length > 0;
    }
  }, [content, engineSpec, mode]);

  // Customize autocomplete filter to only filter when not in fixed options mode
  const filter = useMemo<(options: Option[], state: FilterOptionsState<Option>) => Option[]>(() => {
    return fixedOptions ? (options: Option[]) => options : createFilterOptions<Option>();
  }, [fixedOptions]);

  const [inputValue, setInputValue] = useState(
    fixedOptions
      ? options.find((option) => option.id === content.value)?.label || content.value
      : content.value,
  );
  const handleInputChange = useCallback(
    (event: React.SyntheticEvent<Element, Event>, value: string | Option | null) => {
      if (typeof value === 'string') {
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

        if (!updatedShortcutMode && mode === Mode.LITERAL) {
          setInputValue(value);
          // dispatch update if changed
          if (content.value !== value) {
            dispatch(updateValue(content.key, value));
          }
        }
      }
    },
    [content, mode, setMode, shortcutMode, setShortcutMode, dispatch, setInputValue],
  );

  const handleChange = useCallback(
    (event: React.SyntheticEvent, value: Option | string | null, reason: string) => {
      if (reason !== 'selectOption' && reason !== 'clear') {
        return;
      }
      if (typeof value !== 'string' && value !== null) {
        const option: Option = value;
        const id = option.id;
        if (mode === Mode.LITERAL) {
          if (id === FUNCTION_OPTION_ID) {
            setMode(Mode.FUNCTION);
            setInputValue('');
          } else if (id === VARIABLE_OPTION_ID) {
            setMode(Mode.VARIABLE);
            setInputValue('');
          } else {
            dispatch(updateValue(content.key, option.id));
            setOpen(false);
          }
        } else if (mode === Mode.FUNCTION) {
          if (id === LITERAL_OPTION_ID) {
            setMode(Mode.LITERAL);
          } else {
            // use the selected function
            dispatch(convertValueToFunction(content.key, id));
          }
        } else if (mode === Mode.VARIABLE) {
          if (id === LITERAL_OPTION_ID) {
            setMode(Mode.LITERAL);
          } else {
            dispatch(convertValueToReference(content.key, id));
          }
        }
        setShortcutMode(false);
      }
    },
    [mode, setMode, setShortcutMode, dispatch, setInputValue, setOpen],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const key = event.key;
      if (
        mode !== Mode.LITERAL &&
        shortcutMode &&
        content.value === '' &&
        (key === 'Backspace' || key === 'Escape')
      ) {
        setMode(Mode.LITERAL);
        setShortcutMode(false);
      }
    },
    [content, mode, setMode, shortcutMode, setShortcutMode],
  );

  const handleSelectTypeId = useCallback(
    (typeId: string) => {
      dispatch(updateValueType(content.key, typeId));
    },
    [dispatch, content],
  );

  const label = useMemo(() => {
    const modeLabel = translate(labelKey(`value-mode-${mode}`));
    return translate(labelKey('value-with-mode'), { mode: modeLabel });
  }, [translate, mode]);

  const groupRenderer = useCallback(
    (params: AutocompleteRenderGroupParams) => {
      return (
        <li key={params.key}>
          <GroupHeader>{translate(labelKey(params.group))}</GroupHeader>
          <GroupItems>{params.children}</GroupItems>
        </li>
      );
    },
    [translate],
  );

  return (
    <Stack width={'100%'}>
      <FormControl fullWidth>
        <Autocomplete
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              variant={'standard'}
              error={content.errors !== undefined && content.errors.length > 0}
              helperText={
                content.errors !== undefined && content.errors.length > 0
                  ? content.errors.map((error) => error.code).join(', ')
                  : null
              }
              InputProps={{
                ...params.InputProps,
                type: 'search',
              }}
            />
          )}
          disableClearable
          freeSolo={fixedOptions}
          filterOptions={filter}
          options={options}
          groupBy={(option) => option.groupId}
          renderGroup={groupRenderer}
          onChange={handleChange}
          onInputChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          open={open}
          inputValue={inputValue}
          value={inputValue}
          onKeyDown={handleKeyDown}
          fullWidth={true}
        />
      </FormControl>
      {argumentContent.allowedTypeIds.length > 1 ? (
        <TypeSelector
          contentKey={content.key}
          onSelectType={handleSelectTypeId}
          availableTypeIds={argumentContent.allowedTypeIds}
          selectedTypeId={content.typeId as string}
        />
      ) : (
        <TypeDisplay typeId={content.typeId as string} />
      )}
    </Stack>
  );
}

interface TypeSelectorProps {
  contentKey: string;
  onSelectType: (typeId: string) => void;
  availableTypeIds: string[];
  selectedTypeId: string;
}

function TypeSelector({
  contentKey,
  onSelectType,
  availableTypeIds,
  selectedTypeId,
}: TypeSelectorProps) {
  const translate = useTranslate();

  const options: Option[] = useMemo(
    () =>
      availableTypeIds.map((typeId) => {
        return {
          id: typeId,
          label: translate(typeTitleKey(typeId)),
          groupId: '',
        };
      }),
    [availableTypeIds, translate],
  );
  const selectedOption = useMemo(() => {
    return options.find((option) => option.id === selectedTypeId);
  }, [options, selectedTypeId]);

  const handleChange = useCallback(
    (event: React.SyntheticEvent, value: Option, reason: string) => {
      if (reason !== 'selectOption') {
        return;
      }
      onSelectType(value.id);
    },
    [contentKey, onSelectType],
  );

  return (
    <FormControl fullWidth sx={{ mt: 3 }}>
      <Autocomplete
        renderInput={(params) => (
          <TextField
            {...params}
            label={'Type'}
            variant={'standard'}
            InputProps={{
              ...params.InputProps,
              type: 'search',
            }}
          />
        )}
        disableClearable
        freeSolo={false}
        options={options}
        onChange={handleChange}
        value={selectedOption}
        fullWidth={true}
      />
    </FormControl>
  );
}

interface TypeDisplayProps {
  typeId: string;
}

function TypeDisplay({ typeId }: TypeDisplayProps) {
  let translate = useTranslate();
  const title = translate(typeTitleKey(typeId));
  const description = translate(typeDescriptionKey(typeId));
  return (
    <Box>
      <Typography>{title}</Typography>
    </Box>
  );
}

const GroupHeader = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: '-8px',
  padding: '4px 10px',
  color: theme.palette.primary.main,
  backgroundColor:
    theme.palette.mode === 'light'
      ? lighten(theme.palette.primary.light, 0.85)
      : darken(theme.palette.primary.main, 0.8),
}));

const GroupItems = styled('ul')({
  padding: 0,
});
