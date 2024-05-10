import {
  ContentKey,
  ContentType,
  ReferenceContent,
  TypeIntersection,
  TypePropertySpec,
  VariableContent,
} from '../../types';
import { useContent } from '../../hooks/useContent';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemButton,
  ListItemText,
  Slide,
  Stack,
  Typography,
} from '@mui/material';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslate } from '../I18n/I18n';
import { labelKey, typePropertyTitleKey } from '../../util';
import { VariableView } from '../VariableView/VariableView';
import { useDispatch, useSelector } from 'react-redux';
import { selectEngineSpec, updateReferencePath } from '../../redux/slices/frameEditorSlice';
import { TypeView } from '../TypeView/TypeView';
import { ListItemView, ListView } from '../SharedElements/SharedElements';

export interface ReferencePathEditorProps {
  contentKey: ContentKey;
  open: boolean;
  onClose: () => void;
}

export function ReferencePathEditor({ contentKey, open, onClose }: ReferencePathEditorProps) {
  const dispatch = useDispatch();
  const { variableKey, path } = useContent<ReferenceContent>(contentKey, ContentType.REFERENCE);
  const { type, multi, optional } = useContent<VariableContent>(variableKey, ContentType.VARIABLE);

  const [selectedPath, setSelectedPath] = useState(path);

  const translate = useTranslate();
  const dialogTitle = translate(labelKey('edit-reference'));
  const selectedVariable = translate(labelKey('selected-variable'));
  const availableProperties = translate(labelKey('available-properties'));

  const handleSelect = useCallback(() => {
    dispatch(updateReferencePath(contentKey, selectedPath));
    onClose();
  }, [onClose, contentKey, selectedPath, dispatch]);

  const selectRoot = useCallback(() => {
    setSelectedPath([]);
  }, [setSelectedPath]);

  return (
    <Dialog open={open} title={dialogTitle}>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent sx={{ minWidth: '500px' }}>
        <Box>
          <Typography>{selectedVariable}</Typography>
          <ListView>
            <ListItemView key={variableKey}>
              <ListItemButton onClick={selectRoot} selected={selectedPath.length === 0}>
                <VariableView contentKey={variableKey} />
              </ListItemButton>
            </ListItemView>
          </ListView>
        </Box>
        <Box>
          <Typography>{availableProperties}</Typography>
          <PropertyTreeView
            {...{
              type,
              multi,
              optional,
              selectedPath,
              path: [] as string[],
              onSelect: setSelectedPath,
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant={'outlined'}>
          Cancel
        </Button>
        <Button onClick={handleSelect} variant={'contained'} color={'primary'}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface PropertyTreeViewProps {
  type: TypeIntersection;
  multi: boolean;
  optional: boolean;
  path: string[];
  selectedPath: string[];
  onSelect: (path: string[]) => void;
}

function PropertyTreeView({
  type,
  multi,
  optional,
  path,
  selectedPath,
  onSelect,
}: PropertyTreeViewProps) {
  const { types } = useSelector(selectEngineSpec);
  if (type.length !== 1) {
    return <>TODO: Children are not selectable due to type intersection</>;
  }
  const [typeId] = type;
  const { properties } = types[typeId];

  if (Object.keys(properties).length === 0) {
    return null;
  }

  return (
    <ListView>
      {Object.entries(properties).map(([propertyName, propertySpec]) => {
        const props = {
          propertyName,
          propertySpec,
          parentTypeId: typeId,
          treeProps: {
            type: propertySpec.type,
            multi: multi || propertySpec.multi,
            optional: optional || propertySpec.optional,
            selectedPath,
            onSelect,
            path: [...path, propertyName],
          },
        };
        return <PropertyView key={propertyName} {...props} />;
      })}
    </ListView>
  );
}

interface PropertyViewProps {
  parentTypeId: string;
  propertyName: string;
  propertySpec: TypePropertySpec;
  treeProps: PropertyTreeViewProps;
}

function PropertyView({ parentTypeId, propertyName, treeProps }: PropertyViewProps) {
  const translate = useTranslate();
  const propertyLabel = translate(typePropertyTitleKey(parentTypeId, propertyName));
  const { type, optional, multi, selectedPath, path, onSelect } = treeProps;
  const typeView = <TypeView {...{ type, optional, multi }} />;

  const [selected, directlySelected] = useMemo(() => {
    const selected =
      selectedPath.length >= path.length &&
      selectedPath
        .slice(0, path.length)
        .every((propertyName, index) => propertyName === path[index]);
    const directlySelected = selected && selectedPath.length === path.length;
    return [selected, directlySelected];
  }, [selectedPath, path]);

  const handleSelect = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onSelect(path);
      e.stopPropagation();
    },
    [onSelect, path],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <ListItemView>
      <ListItemButton selected={directlySelected} onClick={handleSelect}>
        <Stack direction={'column'} width={'100%'}>
          <ListItemButton
            disableRipple
            disableTouchRipple
            sx={{ p: 0, ':hover': { backgroundColor: 'inherit' } }}
          >
            <ListItemText primary={propertyLabel} secondary={typeView} />
          </ListItemButton>
          <Box ref={containerRef} sx={{ overflow: 'hidden' }}>
            <Slide direction={'down'} in={selected} container={containerRef.current}>
              <Box>{selected && <PropertyTreeView {...treeProps} />}</Box>
            </Slide>
          </Box>
        </Stack>
      </ListItemButton>
    </ListItemView>
  );
}
