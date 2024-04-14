import { Provider, useSelector } from 'react-redux';
import { Box, Container, Divider, Paper, Stack, SxProps, Theme, Typography } from '@mui/material';
import {
  ActionContent,
  ConditionalContent,
  ContentType,
  ControlContent,
  ControlType,
  EngineSpec,
  FunctionContent,
  LogicForgeConfig,
  ProcessConfig,
  ProcessContent,
} from '../../types';
import { initEditor, selectSelectedSubtree } from '../../redux/slices/editors';
import React, { useContext, useEffect, useMemo } from 'react';
import {
  actionDescriptionKey,
  actionParameterTitleKey,
  actionTitleKey,
  controlDescriptionKey,
  controlTitleKey,
  functionDescriptionKey,
  functionTitleKey,
  generateTypeMapping,
  labelKey,
  processDescriptionKey,
  processTitleKey,
  TypeInfo,
} from '../../util';
import { Info } from '../Info/Info';
import { ActionIcon, FunctionIcon, ProcessIcon } from '../Icons/Icons';
import { getStore, StoreStructure } from '../../redux';
import { InputParameterList } from '../InputParameterList/InputParameterList';
import { InitialVariablesDisplay } from '../InitialVariablesDisplay/InitialVariablesDisplay';
import { I18n, MessageTree, useTranslate } from '../I18n/I18n';
import { FrameSection } from '../FrameSection/FrameSection';
import { ExecutableBlockEditor } from '../ExecutableBlockEditor/ExecutableBlockEditor';
import { VariableEditor } from '../VariableEditor/VariableEditor';

export type EditorInfo = {
  engineSpec: EngineSpec;
  typeMappings: { [key: string]: TypeInfo };
};
export const EditorContext = React.createContext<EditorInfo | undefined>(undefined);

enum FrameType {
  PROCESS,
  ACTION,
  FUNCTION,
  CONTROL,
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
  }, []);

  const typeMappings = generateTypeMapping(engineSpec.types);

  const editorInfo: EditorInfo = {
    engineSpec,
    typeMappings,
  };

  return (
    <Provider store={store}>
      <EditorContext.Provider value={editorInfo}>
        <I18n translations={translations}>
          <FrameEditorInternal />
        </I18n>
      </EditorContext.Provider>
    </Provider>
  );
}

function FrameEditorInternal() {
  const selection = useSelector((state: StoreStructure) => selectSelectedSubtree(state));

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
        } else if (contentType === ContentType.CONTROL) {
          // Only show a frame for conditionals when directly selected or editing the condition
          if (i === selection.length - 1 || selection[i + 1].type !== ContentType.BLOCK) {
            children.push(<Frame content={content as FrameContent} key={content.key}></Frame>);
          }
        }
      }
    }
    return children;
  }, [selection]);

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
    case ContentType.CONTROL:
      if (content.controlType === ControlType.CONDITIONAL) {
        renderedFrameContents = <ControlFrame content={content as ConditionalContent} />;
      } else {
        throw new Error(`Unknown control type: ${content.controlType}`);
      }
      break;
  }

  const sx: SxProps<Theme> = {
    my: 1,
  };
  // Since the process frame can nest deeply, allow it to expand as needed. Constrain all other frames.
  if (content.type === ContentType.PROCESS) {
    sx.minWidth = FRAME_WIDTH;
  } else {
    sx.width = FRAME_WIDTH;
  }

  return (
    <div className={'logicforgeFrameEditor__frame'}>
      <Container sx={sx}>{renderedFrameContents}</Container>
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
  const title = translate(processTitleKey(processName));
  const description = translate(processDescriptionKey(processName));
  const initVarsTitle = translate(labelKey('initial-variables'));
  const actionsTitle = translate(labelKey('actions'));
  const returnValueTitle = translate(labelKey('return-value'));

  return (
    <Stack spacing={1} className={'logicforgeFrameEditor__processFrame'}>
      <FrameHeading
        title={title}
        description={description}
        subtitle={'Process'}
        type={FrameType.PROCESS}
      />
      <FrameSection title={initVarsTitle}>
        <InitialVariablesDisplay initialVariables={Object.values(specification.inputs)} />
      </FrameSection>
      <FrameSection title={actionsTitle}>
        <ExecutableBlockEditor contentKey={content.rootBlockKey as string} />
      </FrameSection>
      {specification.output && <FrameSection title={returnValueTitle}></FrameSection>}
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
  const title = translate(actionTitleKey(actionName));
  const description = translate(actionDescriptionKey(actionName));

  return (
    <Stack spacing={1} className={'logicforgeFrameEditor__actionFrame'}>
      <FrameHeading
        title={title}
        subtitle={'Action'}
        description={description}
        type={FrameType.ACTION}
      />
      {Object.entries(specification.inputs)?.map(([name]) => {
        const title = translate(actionParameterTitleKey(actionName, name));
        return (
          <FrameSection key={name} title={title}>
            <InputParameterList
              contentKey={content.childKeyMap[name]}
              name={name}
              parent={content}
            />
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
  const { engineSpec } = useContext(EditorContext) as EditorInfo;

  const functionName = content.name;
  const specification = engineSpec.functions[functionName];

  const translate = useTranslate();
  const title = translate(functionTitleKey(functionName));
  const description = translate(functionDescriptionKey(functionName));

  return (
    <div className={'logicforgeFrameEditor__functionFrame'}>
      <FrameHeading
        title={title}
        subtitle={'Function'}
        description={description}
        type={FrameType.FUNCTION}
      />
      <Stack spacing={1}>
        {Object.entries(specification.inputs)?.map(([name]) => {
          return (
            <Paper key={name}>
              <InputParameterList
                contentKey={content.childKeyMap[name]}
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

interface ConditionalFrameProps {
  content: ConditionalContent;
}

function ControlFrame({ content }: ConditionalFrameProps) {
  const controlType = content.controlType;
  const conditionalArgKey = content.childKeyMap['condition'];
  if (conditionalArgKey === undefined) {
    throw new Error(
      `Conditional content ${content.key} in illegal state: missing 'condition' argument.`,
    );
  }

  const translate = useTranslate();
  const title = translate(controlTitleKey(controlType));
  const description = translate(controlDescriptionKey(controlType));

  return (
    <div className={'logicforgeFrameEditor__controlFrame'}>
      <FrameHeading
        title={title}
        subtitle={'Conditional'}
        description={description}
        type={FrameType.CONTROL}
      />
      <Stack spacing={1}>
        <Paper>
          <InputParameterList
            contentKey={conditionalArgKey}
            name={'conditional'}
            parent={content}
          />
        </Paper>
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
