import { Provider, useDispatch, useSelector } from 'react-redux';
import { Box, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import {
  ActionContent,
  ContentType,
  EngineSpec,
  FunctionContent,
  LogicForgeConfig,
  ProcessConfig,
  ProcessContent,
} from '../../types';
import { initEditor, selectSelectedSubtree } from '../../redux/slices/editors';
import React, { useContext, useEffect, useState } from 'react';
import { I18n, useTranslate } from 'react-polyglot';
import {
  actionDescriptionPath,
  actionTitlePath,
  functionDescriptionPath,
  functionTitlePath,
  generateTypeMappings,
  processDescriptionPath,
  processTitlePath,
  TypeInfo,
} from '../../util';
import { Info } from '../Info/Info';
import { ActionIcon, FunctionIcon, ProcessIcon } from '../Icons/Icons';
import { getStore, StoreStructure } from '../../redux';
import { ActionParameterList } from '../ActionParameterList/ActionParameterList';
import { InputParameterList } from '../InputParameterList/InputParameterList';

export type EditorInfo = {
  engineSpec: EngineSpec;
  typeMappings: { [key: string]: TypeInfo };
};
export const EditorContext = React.createContext<EditorInfo | undefined>(undefined);

enum FrameType {
  PROCESS,
  ACTION,
  FUNCTION,
}

/**
 * The content types that are rendered using frames
 */
type FrameContent = ProcessContent | ActionContent | FunctionContent;

export type FrameEditorProps = {
  config: LogicForgeConfig;
  engineSpec: EngineSpec;
  translations: object;
  locale: string;
};

export function FrameEditor({ config, engineSpec, translations, locale }: FrameEditorProps) {
  const store = getStore();

  useEffect(() => {
    store.dispatch(initEditor(config as ProcessConfig, engineSpec));
  }, []);

  const [childFrames, setChildFrames] = useState<React.JSX.Element[]>([]);

  const typeMappings = generateTypeMappings(engineSpec.types);

  const editorInfo: EditorInfo = {
    engineSpec,
    typeMappings,
  };

  return (
    <Provider store={store}>
      <EditorContext.Provider value={editorInfo}>
        <I18n messages={translations} locale={locale}>
          <FrameEditorInternal />
        </I18n>
      </EditorContext.Provider>
    </Provider>
  );
}

function FrameEditorInternal() {
  const selection = useSelector((state: StoreStructure) => selectSelectedSubtree(state));

  const [childFrames, setChildFrames] = useState<React.JSX.Element[]>([]);

  useEffect(() => {
    const children: React.JSX.Element[] = [];
    if (selection !== undefined) {
      for (let i = 0; i < selection.length; i++) {
        const content = selection[i];
        const contentType = content.type;
        if (
          contentType === ContentType.PROCESS ||
          contentType === ContentType.ACTION ||
          contentType === ContentType.FUNCTION
        ) {
          children.push(<Frame content={content as FrameContent} key={content.key}></Frame>);
        }
      }
    }
    setChildFrames(children);
  }, [selection, setChildFrames]);

  return (
    <Stack direction="row" spacing={0} divider={<Divider orientation="vertical" flexItem />}>
      {childFrames}
    </Stack>
  );
}

interface FrameProps {
  content: FrameContent;
}

function Frame({ content }: FrameProps) {
  let renderedFrameContents = null;
  switch (content.type) {
    case ContentType.PROCESS:
      renderedFrameContents = <ProcessFrame content={content} />;
      break;
    case ContentType.ACTION:
      renderedFrameContents = <ActionFrame content={content} />;
      break;
    case ContentType.FUNCTION:
      renderedFrameContents = <FunctionFrame content={content} />;
      break;
  }

  return (
    <div className={'logicforgeFrameEditor__frame'}>
      <Container sx={{ my: 1, width: '400px' }}>{renderedFrameContents}</Container>
    </div>
  );
}

interface ProcessFrameProps extends FrameProps {
  content: ProcessContent;
}

function ProcessFrame({ content }: ProcessFrameProps) {
  const editorInfo = useContext(EditorContext) as EditorInfo;

  const processName = content.name;
  const specification = editorInfo.engineSpec.processes[processName];

  const translate = useTranslate();
  const title = translate(processTitlePath(processName));
  const description = translate(processDescriptionPath(processName));

  return (
    <Stack spacing={1} className={'logicforgeFrameEditor__processFrame'}>
      <FrameHeading
        title={title}
        description={description}
        subtitle={'Process'}
        type={FrameType.PROCESS}
      />
      <Paper>
        <ActionParameterList contentKey={content.key} name={'root'} parent={content} />
      </Paper>
    </Stack>
  );
}

interface ActionFrameProps extends FrameProps {
  content: ActionContent;
}

function ActionFrame({ content }: ActionFrameProps) {
  const editorInfo = useContext(EditorContext) as EditorInfo;

  const actionName = content.name;
  const specification = editorInfo.engineSpec.actions[actionName];

  const translate = useTranslate();
  const title = translate(actionTitlePath(actionName));
  const description = translate(actionDescriptionPath(actionName));

  return (
    <Stack spacing={1} className={'logicforgeFrameEditor__actionFrame'}>
      <FrameHeading
        title={title}
        subtitle={'Action'}
        description={description}
        type={FrameType.ACTION}
      />
      {Object.entries(specification.actionParameters)?.map(([name]) => {
        return (
          <Paper key={name}>
            <ActionParameterList
              contentKey={content.actionChildKeys[name]}
              name={name}
              parent={content}
            />
          </Paper>
        );
      })}
      {Object.entries(specification.inputParameters)?.map(([name]) => {
        return (
          <Paper key={name}>
            <InputParameterList
              contentKey={content.inputChildKeys[name]}
              name={name}
              parent={content}
            />
          </Paper>
        );
      })}
    </Stack>
  );
}

export interface FunctionFrameProps extends FrameProps {
  content: FunctionContent;
}

export function FunctionFrame({ content }: FunctionFrameProps) {
  const editorInfo = useContext(EditorContext) as EditorInfo;

  const functionName = content.name;
  const specification = editorInfo.engineSpec.functions[functionName];

  const translate = useTranslate();
  const title = translate(functionTitlePath(functionName));
  const description = translate(functionDescriptionPath(functionName));

  return (
    <div className={'logicforgeFrameEditor__functionFrame'}>
      <FrameHeading
        title={title}
        subtitle={'Function'}
        description={description}
        type={FrameType.FUNCTION}
      />
      <Stack spacing={1}>
        {Object.entries(specification.parameters)?.map(([name]) => {
          return (
            <Paper key={name}>
              <InputParameterList
                contentKey={content.childKeys[name]}
                name={name}
                parent={content}
              />
            </Paper>
          );
        })}
      </Stack>
    </div>
  );
}

export interface FrameHeadingProps {
  title: string;
  description?: string;
  subtitle: string;
  type: FrameType;
}

export function FrameHeading({ title, description, subtitle, type }: FrameHeadingProps) {
  return (
    <Stack direction="row">
      <Box sx={{ mb: 1.5 }}>
        <Typography variant={'h4'} fontSize={'1.5rem'}>
          {title}
          {description !== undefined && <Info text={description} />}
        </Typography>
        {subtitle !== undefined && (
          <Typography
            variant={'h5'}
            color={'#37ac8f'}
            fontSize={'1rem'}
            fontWeight={500}
            style={{ fontVariant: 'all-small-caps' }}
          >
            {FrameIcon({ type })}
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

interface FrameIconProps {
  type: FrameType;
}

function FrameIcon({ type }: FrameIconProps) {
  switch (type) {
    case FrameType.PROCESS:
      return <ProcessIcon fontSize={'small'} sx={{ mb: '-5px', mr: '5px' }} />;
    case FrameType.ACTION:
      return <ActionIcon fontSize={'small'} sx={{ mb: '-5px', mr: '2px' }} />;
    case FrameType.FUNCTION:
      return <FunctionIcon fontSize={'small'} sx={{ mb: '-5px', mr: '2px' }} />;
  }
}
