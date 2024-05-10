import { useSelector } from 'react-redux';
import {
  selectContent,
  selectFunctionSpec,
  selectIsInSelectedPath,
} from '../../redux/slices/editor';
import {
  ArgumentContent,
  Content,
  ContentKey,
  ContentType,
  ExpressionContent,
  ExpressionSpec,
  FunctionContent,
  ReferenceContent,
  TypeIntersection,
  ValueContent,
  VariableContent,
} from '../../types';
import { Box, darken, lighten, Slide, styled, Typography, useTheme } from '@mui/material';
import React, { useRef } from 'react';
import { useTranslate } from '../I18n/I18n';
import {
  functionDescriptionKey,
  functionParameterDescriptionKey,
  functionParameterTitleKey,
  functionTitleKey,
  labelKey,
} from '../../util';
import { isWellKnownNumberType, WellKnownType } from '../../constant/well-known-type';
import { useContent } from '../../hooks/useContent';
import { DoubleArrowRawSVG } from '../Icons/Icons';
import { TypeView } from '../TypeView/TypeView';

export interface SubTreeViewProps {
  contentKey: string;
}

/**
 * A component displayed below function items to allow a minimal view of  their subcomponents
 * inline and without needing to open child frames.
 * @param contentKey
 * @constructor
 */
export function SubTreeView({ contentKey }: SubTreeViewProps) {
  const allContent = useSelector(selectContent);
  const content = useContent<FunctionContent>(contentKey, ContentType.FUNCTION);
  const selected = useSelector(selectIsInSelectedPath(contentKey));

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      sx={{
        backgroundImage: `url('data:image/svg+xml;base64,${btoa(DoubleArrowRawSVG())}')`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '80px 80px',
        overflow: 'hidden',
      }}
      ref={containerRef}
    >
      <Slide in={!selected} container={containerRef.current} direction={'left'} appear={false}>
        <Wrapper>
          <FunctionTreeView content={content} allContent={allContent} root={true} />
        </Wrapper>
      </Slide>
    </Box>
  );
}

interface ContentProps<TYPE extends Content> {
  content: TYPE;
  allContent: { [key: ContentKey]: Content };
}

interface FunctionTreeViewProps extends ContentProps<FunctionContent> {
  root: boolean;
}

function FunctionTreeView({ content, allContent, root }: FunctionTreeViewProps) {
  const translate = useTranslate();
  const functionName = content.name;
  const functionSpec = useSelector(selectFunctionSpec(functionName));
  const title = translate(functionTitleKey(functionName));
  const description = translate(functionDescriptionKey(functionName));
  const { type, multi } = content;
  const labelProps = { title, description, type, multi };

  const children = Object.entries(content.childKeyMap).map(([paramName, argKey]) => {
    const paramTitle = translate(functionParameterTitleKey(functionName, paramName));
    const paramDescription = translate(functionParameterDescriptionKey(functionName, paramName));
    const argContent = allContent[argKey] as ArgumentContent;
    const expressionSpec = functionSpec.inputs[paramName];
    return (
      <ArgumentTreeView
        key={paramName}
        content={argContent}
        allContent={allContent}
        expressionSpec={expressionSpec}
        title={paramTitle}
        description={paramDescription}
      />
    );
  });

  return (
    <Box display={'inline-grid'}>
      {!root && <LabelWithTypeView {...labelProps} />}
      <ChildWrapper>{children}</ChildWrapper>
    </Box>
  );
}

function ReferenceTreeView({ content, allContent }: ContentProps<ReferenceContent>) {
  const translate = useTranslate();
  const referenceLabel = translate(labelKey('reference'));
  const description = '';
  const type = content.type;
  const multi = content.multi;

  const variableLabel = translate(labelKey('variable'));
  const propertyLabel = translate(labelKey('property'));

  const variable = allContent[content.variableKey] as VariableContent;
  const noPath = variable.initial ? content.path.length === 1 : content.path.length === 0;

  const theme = useTheme();

  return (
    <Box display={'inline-grid'}>
      <LabelWithTypeView {...{ title: referenceLabel, description, type, multi }} />
      <ChildWrapper>
        <ArgList>
          <li key="reference">
            <Typography component={'span'} fontSize={theme.typography.body2.fontSize}>
              {variableLabel}:&nbsp;
            </Typography>
            <Typography
              component={'span'}
              fontSize={theme.typography.body2.fontSize}
              color={theme.palette.text.secondary}
            >
              {variable.title}
            </Typography>
          </li>
          {!noPath && (
            <li key="path">
              <Typography component={'span'} fontSize={theme.typography.body2.fontSize}>
                {propertyLabel}:&nbsp;
              </Typography>
              <Typography
                component={'span'}
                fontSize={theme.typography.body2.fontSize}
                color={theme.palette.text.secondary}
              >
                TODO
              </Typography>
            </li>
          )}
        </ArgList>
      </ChildWrapper>
    </Box>
  );
}

function ValueTreeView({ content }: ContentProps<ValueContent>) {
  let [typeId] = content.type;
  if (typeId !== null && Object.values(WellKnownType as object).includes(typeId)) {
    if (typeId === WellKnownType.STRING) {
      return (
        <Typography
          sx={(theme) => ({
            fontSize: theme.typography.body2.fontSize,
            display: 'inline',
          })}
        >
          &quot;
          <Typography
            component={'span'}
            sx={(theme) => ({
              px: '4px',
              color: theme.palette.text.secondary,
              fontSize: theme.typography.body2.fontSize,
              display: 'inline',
              fontFamily: 'monospace',
            })}
          >
            {content.value}
          </Typography>
          &quot;&nbsp;
          <TypeView type={content.type} />
        </Typography>
      );
    } else if (isWellKnownNumberType(typeId)) {
      return (
        <Typography
          sx={(theme) => ({
            color: theme.palette.info.main,
            fontSize: theme.typography.body2.fontSize,
            display: 'inline',
          })}
        >
          {content.value}&nbsp;
          <TypeView type={content.type} />
        </Typography>
      );
    } else if (typeId === WellKnownType.BOOLEAN) {
      return (
        <Typography
          sx={(theme) => ({
            color: theme.palette.primary.main,
            fontSize: theme.typography.body2.fontSize,
            fontFamily: 'monospace',
            display: 'inline',
          })}
        >
          {content.value}&nbsp;
          <TypeView type={content.type} />
        </Typography>
      );
    }
  }
  return (
    <Typography>
      {content.value}&nbsp;
      <TypeView type={content.type} />
    </Typography>
  );
}

interface ArgumentTreeViewProps extends ContentProps<ArgumentContent> {
  expressionSpec: ExpressionSpec;
  title: string;
  description: string;
}

function ArgumentTreeView({
  content,
  allContent,
  expressionSpec,
  title,
  description,
}: ArgumentTreeViewProps) {
  let inline = false;
  const single = !expressionSpec.multi;
  if (single) {
    const expressionKey = content.childKeys[0];
    const expressionContent = allContent[expressionKey];
    if (expressionContent.differentiator === ContentType.VALUE) {
      inline = true;
    }
  }
  return (
    <Box>
      <Box display={inline ? 'inline-flex' : 'block'}>
        <Box>
          <LabelWithTypeView
            title={title}
            description={description}
            type={expressionSpec.type}
            multi={expressionSpec.multi}
          />
        </Box>
        <Box sx={{ flexGrow: inline ? 1 : undefined }}>
          <ChildWrapper>
            {single ? (
              <ExpressionTreeView
                content={allContent[content.childKeys[0]] as ExpressionContent}
                allContent={allContent}
                expressionSpec={expressionSpec}
              />
            ) : (
              <ArgList>
                {content.childKeys.map((contentKey) => (
                  <li key={contentKey}>
                    <ExpressionTreeView
                      expressionSpec={expressionSpec}
                      content={allContent[contentKey] as ExpressionContent}
                      allContent={allContent}
                    />
                  </li>
                ))}
              </ArgList>
            )}
          </ChildWrapper>
        </Box>
      </Box>
    </Box>
  );
}

interface ExpressionTreeViewProps extends ContentProps<ExpressionContent> {
  expressionSpec: ExpressionSpec;
}

function ExpressionTreeView({ content, allContent, expressionSpec }: ExpressionTreeViewProps) {
  switch (content.differentiator) {
    case ContentType.FUNCTION:
      return (
        <FunctionTreeView
          content={content as FunctionContent}
          allContent={allContent}
          root={false}
        />
      );
    case ContentType.REFERENCE:
      return <ReferenceTreeView content={content as ReferenceContent} allContent={allContent} />;
    case ContentType.VALUE:
      return <ValueTreeView content={content as ValueContent} allContent={allContent} />;
  }
  return <></>;
}

interface LabelWithTypeViewProps {
  title: string;
  description: string;
  type: TypeIntersection;
  multi: boolean;
}

function LabelWithTypeView({ title, description, type, multi }: LabelWithTypeViewProps) {
  return (
    <Typography fontSize={(theme) => theme.typography.body2.fontSize}>
      {title}
      &nbsp;
      <TypeView {...{ type, multi }} />
    </Typography>
  );
}

const Wrapper = styled('div')(({ theme }) => ({
  width: '100%',
  padding: '4px 0',
  margin: '0 0 4px 0',
  backgroundColor:
    theme.palette.mode === 'light'
      ? darken(theme.palette.background.paper, 0.2)
      : lighten(theme.palette.background.paper, 0.2),
}));

const ChildWrapper = styled('div')(({ theme }) => ({
  width: '100%',
  marginLeft: '10px',
}));

const ArgList = styled('ul')(({ theme }) => ({
  width: '100%',
  padding: 0,
  listStylePosition: 'inside',
}));
