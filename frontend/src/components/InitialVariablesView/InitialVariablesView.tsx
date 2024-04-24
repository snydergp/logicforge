import { VariableSpec } from '../../types';
import React, { ReactElement, useMemo } from 'react';
import { ListItem, ListItemButton } from '@mui/material';
import { VariableView } from '../VariableView/VariableView';

export interface InitialVariablesViewProps {
  initialVariables: VariableSpec[];
}

export function InitialVariablesView({ initialVariables }: InitialVariablesViewProps) {
  return useMemo(() => {
    const out: ReactElement[] = [];
    for (let i = 0; i < initialVariables.length; i++) {
      const initialVariable = initialVariables[i];
      const item = (
        <ListItem key={`initialVariable_${i}`}>
          <ListItemButton>
            <VariableView
              type={initialVariable.type}
              multi={initialVariable.multi}
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
    return <>{out}</>;
  }, [initialVariables]);
}
