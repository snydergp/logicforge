import { VariableSpec } from '../../types';
import React, { ReactElement, useMemo } from 'react';
import { ListItem, ListItemButton, Stack } from '@mui/material';
import { VariableDisplay } from '../VariableDisplay/VariableDisplay';

export interface InitialVariablesDisplayProps {
  initialVariables: VariableSpec[];
}

export function InitialVariablesDisplay({ initialVariables }: InitialVariablesDisplayProps) {
  return useMemo(() => {
    const out: ReactElement[] = [];
    for (let i = 0; i < initialVariables.length; i++) {
      const initialVariable = initialVariables[i];
      const item = (
        <ListItem key={`initialVariable_${i}`}>
          <ListItemButton>
            <VariableDisplay
              typeId={initialVariable.typeId}
              optional={initialVariable.optional}
              title={initialVariable.title}
              description={initialVariable.description}
              initial={true}
            />
          </ListItemButton>
        </ListItem>
      );
      out.push(item);
    }
    return (
      <Stack direction={'column'} spacing={0}>
        {out}
      </Stack>
    );
  }, [initialVariables]);
}
