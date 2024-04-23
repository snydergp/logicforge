import { Provider, useSelector } from 'react-redux';
import { Box, Container, Divider, Slide, Stack, SxProps, Theme, Typography } from '@mui/material';
import {
  ActionContent,
  ArgumentContent,
  Content,
  ContentType,
  ControlContent,
  EngineSpec,
  FunctionContent,
  LogicForgeConfig,
  PROCESS_RETURN_PROP,
  ProcessConfig,
  ProcessContent,
} from '../../types';
import {
  initEditor,
  selectContent,
  selectEngineSpec,
  selectSelectedSubtree,
} from '../../redux/slices/editors';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  actionDescriptionKey,
  actionParameterDescriptionKey,
  actionParameterTitleKey,
  actionTitleKey,
  contentEqual,
  functionDescriptionKey,
  functionParameterDescriptionKey,
  functionParameterTitleKey,
  functionTitleKey,
  labelKey,
  processDescriptionKey,
  processTitleKey,
  typeTitleKey,
} from '../../util';
import { Info } from '../Info/Info';
import { ActionIcon, FunctionIcon, ProcessIcon } from '../Icons/Icons';
import { getStore, StoreStructure } from '../../redux';
import { InitialVariablesDisplay } from '../InitialVariablesDisplay/InitialVariablesDisplay';
import { I18n, MessageTree, useTranslate } from '../I18n/I18n';
import { FrameSection } from '../FrameSection/FrameSection';
import { ExecutableBlockEditor } from '../ExecutableBlockEditor/ExecutableBlockEditor';
import { VariableEditor } from '../VariableEditor/VariableEditor';
import { ArgumentEditor } from '../ArgumentEditor/ArgumentEditor';

enum FrameType {
  PROCESS,
  ACTION,
  FUNCTION,
}

const FRAME_WIDTH = '400px';

/**
 * The content types that are rendered using frames
 */
type FrameContent = ProcessContent | ActionContent | FunctionContent | ControlContent;

export type FrameEditorProps = {
  config: LogicForgeConfig;
  engineSpec: EngineSpec;
  translations: MessageTree;
};

export function FrameEditor({ config, engineSpec, translations }: FrameEditorProps) {
  const store = getStore();

  useEffect(() => {
    store.dispatch(initEditor(config as ProcessConfig, engineSpec));
  }, [store, config, engineSpec]);

  return (
    <Provider store={store}>
      <I18n translations={translations}>
        <FrameEditorInternal />
      </I18n>
    </Provider>
  );
}

function FrameEditorInternal() {
  const selection = useSelector<StoreStructure, Content[]>(selectSelectedSubtree, contentEqual);

  const childFrames = useMemo(() => {
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
    return children;
  }, [selection]);

  return (
    <Stack
      direction="row"
      flexWrap={'nowrap'}
      overflow={'scroll'}
      sx={{ overflowX: 'scroll', width: '100%', height: '100%' }}
      spacing={0}
      divider={<Divider orientation="vertical" flexItem />}
    >
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

  const sx: SxProps<Theme> = {
    my: 1,
    flexShrink: 0,
  };
  // Since the process frame can nest deeply, allow it to expand as needed. Constrain all other frames.
  if (content.type === ContentType.PROCESS) {
    sx.minWidth = FRAME_WIDTH;
  } else {
    sx.width = FRAME_WIDTH;
  }

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Box ref={containerRef} sx={{ ...sx, overflow: 'hidden' }}>
      <Slide
        direction={'right'}
        in={true}
        container={containerRef.current}
        appear={content.type !== ContentType.PROCESS}
      >
        <Container>{renderedFrameContents}</Container>
      </Slide>
    </Box>
  );
}

interface ProcessFrameProps extends FrameProps {
  content: ProcessContent;
}

function ProcessFrame({ content }: ProcessFrameProps) {
  const engineSpec = useSelector(selectEngineSpec);

  const processName = content.name;
  const specification = engineSpec.processes[processName];

  const translate = useTranslate();
  const title = translate(processTitleKey(processName));
  const description = translate(processDescriptionKey(processName));
  const subtitle = translate(labelKey('process'));

  const initVarsTitle = translate(labelKey('initial-variables'));
  const actionsTitle = translate(labelKey('actions'));
  const returnValueTitle = translate(labelKey('return-value'));

  return (
    <Stack spacing={1}>
      <FrameHeading type={FrameType.PROCESS} {...{ title, description, subtitle }} />
      <FrameSection title={initVarsTitle}>
        <InitialVariablesDisplay initialVariables={Object.values(specification.inputs)} />
      </FrameSection>
      <FrameSection title={actionsTitle}>
        <ExecutableBlockEditor contentKey={content.rootBlockKey as string} />
      </FrameSection>
      {specification.output && content.childKeyMap.hasOwnProperty(PROCESS_RETURN_PROP) && (
        <FrameSection title={returnValueTitle}>
          <ArgumentEditor contentKey={content.childKeyMap[PROCESS_RETURN_PROP]} />
        </FrameSection>
      )}
    </Stack>
  );
}

interface ActionFrameProps extends FrameProps {
  content: ActionContent;
}

function ActionFrame({ content }: ActionFrameProps) {
  const engineSpec = useSelector(selectEngineSpec);
  const allContent = useSelector(selectContent);

  const actionName = content.name;
  const specification = engineSpec.actions[actionName];

  const translate = useTranslate();
  const title = translate(actionTitleKey(actionName));
  const description = translate(actionDescriptionKey(actionName));
  const subtitle = translate(labelKey('action'));

  return (
    <Stack spacing={1}>
      <FrameHeading type={FrameType.ACTION} {...{ title, description, subtitle }} />
      {Object.entries(specification.inputs)?.map(([name, spec]) => {
        const argContent = allContent[content.childKeyMap[name]] as ArgumentContent;
        const title = translate(actionParameterTitleKey(actionName, name));
        const description = translate(actionParameterDescriptionKey(actionName, name));
        const subtitle =
          (spec.multi ? translate(labelKey('multiple')) + ' ' : '') +
          translate(typeTitleKey(argContent.calculatedTypeId as string));
        return (
          <FrameSection key={name} {...{ title, description, subtitle }}>
            <ArgumentEditor contentKey={content.childKeyMap[name]} />
          </FrameSection>
        );
      })}
      {content.variableContentKey !== undefined && (
        <VariableEditor contentKey={content.variableContentKey} />
      )}
    </Stack>
  );
}

export interface FunctionFrameProps extends FrameProps {
  content: FunctionContent;
}

export function FunctionFrame({ content }: FunctionFrameProps) {
  const engineSpec = useSelector(selectEngineSpec);

  const functionName = content.name;
  const specification = engineSpec.functions[functionName];

  const translate = useTranslate();
  const title = translate(functionTitleKey(functionName));
  const description = translate(functionDescriptionKey(functionName));
  const subtitle = translate(labelKey('function'));

  return (
    <Stack spacing={1}>
      <FrameHeading type={FrameType.FUNCTION} {...{ title, description, subtitle }} />
      {Object.entries(specification.inputs)?.map(([name, spec]) => {
        const title = translate(functionParameterTitleKey(functionName, name));
        const description = translate(functionParameterDescriptionKey(functionName, name));
        const subtitle =
          (spec.multi ? translate(labelKey('multiple')) + ' ' : '') +
          translate(typeTitleKey(spec.typeId));
        return (
          <FrameSection key={name} {...{ title, description, subtitle }}>
            <ArgumentEditor contentKey={content.childKeyMap[name]} />
          </FrameSection>
        );
      })}
    </Stack>
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
    <Box sx={{ mb: 1.5 }}>
      <Typography variant={'h4'} fontSize={'1.5rem'}>
        {title}
        {description !== undefined && <Info text={description} />}
      </Typography>
      {subtitle !== undefined && (
        <Typography
          variant={'h5'}
          color={(theme) => theme.palette.primary.main}
          fontSize={'1rem'}
          fontWeight={500}
          style={{ fontVariant: 'all-small-caps' }}
        >
          {FrameIcon({ type })}
          {subtitle}
        </Typography>
      )}
    </Box>
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
