import {
  Box,
  darken,
  lighten,
  List,
  ListItem,
  ListItemProps,
  ListProps,
  useTheme,
} from '@mui/material';
import { mergeDeep } from '../../util';

export interface ListViewProps extends ListProps {}

export function ListView(listProps: ListViewProps) {
  return (
    <List
      {...listProps}
      dense
      disablePadding
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default,
        py: 0.5,
        m: 1,
      })}
    />
  );
}

export interface ListItemViewProps extends ListItemProps {}

export function ListItemView(listItemProps: ListItemProps) {
  const theme = useTheme();
  const props = { ...listItemProps };
  const { children, sx } = props;
  delete props.children;
  delete props.sx;
  return (
    <ListItem {...props} sx={mergeDeep({}, sx, { px: 1 })}>
      <Box
        sx={{
          mx: 0,
          minWidth: '220px',
          width: '100%',
          backgroundColor:
            theme.palette.mode === 'light'
              ? darken(theme.palette.background.paper, 0.1)
              : lighten(theme.palette.background.paper, 0.1),
          border: '1px solid',
          borderColor:
            theme.palette.mode === 'light'
              ? darken(theme.palette.background.paper, 0.15)
              : lighten(theme.palette.background.paper, 0.15),
        }}
      >
        {children}
      </Box>
    </ListItem>
  );
}
