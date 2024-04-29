import { ContentKey } from '../../types';
import React from 'react';
import { ListItemButton } from '@mui/material';
import { VariableView } from '../VariableView/VariableView';
import { ListItemView, ListView } from '../SharedElements/SharedElements';

export interface InitialVariablesViewProps {
  variableKeys: ContentKey[];
}

export function InitialVariablesView({ variableKeys }: InitialVariablesViewProps) {
  return (
    <ListView>
      {variableKeys.map((key, index) => {
        return (
          <ListItemView key={`initialVariable_${index}`}>
            <ListItemButton>
              <VariableView contentKey={key} />
            </ListItemButton>
          </ListItemView>
        );
      })}
    </ListView>
  );
}
