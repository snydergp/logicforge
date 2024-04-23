import { ContentKey, ContentType, ReferenceContent, VariableContent } from '../../types';
import { useContent } from '../../hooks/useContent';
import { useSelector } from 'react-redux';
import { useTranslate } from '../I18n/I18n';
import { selectEngineSpec } from '../../redux/slices/editors';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { typePropertyDescriptionKey, typePropertyTitleKey } from '../../util';
import { Box, ListItemText } from '@mui/material';

export interface RefEditorProps {
  contentKey: ContentKey;
}

export function RefEditor({ contentKey }: RefEditorProps) {
  const translate = useTranslate();
  const engineSpec = useSelector(selectEngineSpec);

  const referenceContent = useContent<ReferenceContent>(contentKey, ContentType.REFERENCE);
  const variableContent = useContent<VariableContent>(
    referenceContent.variableKey,
    ContentType.VARIABLE,
  );

  const loadChildren = useCallback(
    (
      parentPath: string[],
      parentTypeId: string,
      parentOptional: boolean,
    ): PropertyReferenceViewModel[] => {
      const typeSpec = engineSpec.types[parentTypeId];
      return Object.entries(typeSpec.properties).map(([propertyName, propertySpec]) => {
        const path = [...parentPath, propertyName];
        const typeId = propertySpec.typeId;
        const title = translate(typePropertyTitleKey(parentTypeId, propertyName));
        const description = translate(typePropertyDescriptionKey(parentTypeId, propertyName));
        const optional = parentOptional || propertySpec.optional;
        const model: PropertyReferenceModel = { path, typeId, title, description, optional };
        const viewModel: PropertyReferenceViewModel = { model };
        return viewModel;
      });
    },
    [engineSpec, translate],
  );

  // For initial variables, the first segment is internal-only and should be hidden from the user
  const [selectedPath /*, setSelectedPath*/] = useState(
    variableContent.initial ? referenceContent.path.slice(1) : referenceContent.path,
  );

  const [mapInitialized, setMapInitialized] = useState(false);
  const [nodeMap, setNodeMap] = useState<ViewModelStore>({});
  useEffect(() => {
    const mapCopy = { ...nodeMap };
    let mapUpdated = false;
    if (mapCopy[ROOT_VIEW_MODEL_KEY] === undefined) {
      mapCopy[ROOT_VIEW_MODEL_KEY] = {
        model: {
          path: [],
          typeId: variableContent.typeId as string,
          title: variableContent.title,
          description: variableContent.description,
          optional: variableContent.optional,
        },
      };
      mapUpdated = true;
    }
    let parentViewModel = mapCopy[ROOT_VIEW_MODEL_KEY];

    // iterate down the path and ensure all the required models are loaded
    for (let i = 1; i <= selectedPath.length; i++) {
      const subPath = selectedPath.slice(0, i);
      const subPathKey = pathToKey(subPath);
      let childViewModel = mapCopy[subPathKey];
      if (childViewModel === undefined) {
        if (parentViewModel.children !== undefined) {
          throw new Error(`Reference path ${subPathKey} does not exist`);
        }
        const parentModel = parentViewModel.model;
        const children = loadChildren(parentModel.path, parentModel.typeId, parentModel.optional);
        children.forEach((newChildViewModel) => {
          const childKey = pathToKey(newChildViewModel.model.path);
          mapCopy[childKey] = newChildViewModel;
          if (childKey === subPathKey) {
            childViewModel = newChildViewModel;
          }
        });
        mapUpdated = true;
        parentViewModel.children = children;
        if (childViewModel === undefined) {
          const missingPropertyName = subPath[subPath.length - 1];
          throw new Error(
            `Loaded children for type ${parentModel.typeId} missing property ${missingPropertyName}`,
          );
        }
      }
    }

    if (mapUpdated) {
      setNodeMap(mapCopy);
    }
    setMapInitialized(true);
  }, [variableContent, selectedPath, nodeMap, setNodeMap, loadChildren, setMapInitialized]);

  const segmentViewModels = useMemo<SegmentViewModel[]>(() => {
    if (!mapInitialized) {
      return [];
    }
    return [...selectedPath.keys(), selectedPath.length].map((index) => {
      const subPath = selectedPath.slice(0, index);
      const subPathKey = pathToKey(subPath);
      const viewModel = nodeMap[subPathKey];
      if (viewModel === undefined) {
        throw new Error(
          `Unexpected state: reference ${contentKey} is missing view model for path ${subPathKey}`,
        );
      }
      const { title, description } = viewModel.model;
      return { title, description };
    });
  }, [contentKey, selectedPath, nodeMap, mapInitialized]);

  const descriptionText = useMemo(() => {
    return segmentViewModels.map((viewModel) => viewModel.title).join(' > ');
  }, [segmentViewModels]);

  return (
    <Box sx={{ ml: 1, width: '100%' }}>
      <ListItemText primary={'Reference Variable'} secondary={<span>{descriptionText}</span>} />
    </Box>
  );
}

type PropertyReferenceModel = {
  path: string[];
  typeId: string;
  title: string;
  description: string;
  optional: boolean;
};

type PropertyReferenceViewModel = {
  model: PropertyReferenceModel;
  children?: PropertyReferenceViewModel[];
};

type ViewModelKey = string;

type ViewModelStore = { [key: ViewModelKey]: PropertyReferenceViewModel };

function pathToKey(path: string[]): ViewModelKey {
  return path.join('/');
}

const ROOT_VIEW_MODEL_KEY: ViewModelKey = pathToKey([]);

type SegmentViewModel = {
  title: string;
  description: string;
};
