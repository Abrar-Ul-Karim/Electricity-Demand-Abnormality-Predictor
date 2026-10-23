import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#007DD7',
      light: '#00A8F1',
      dark: '#013D95',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f172a',
      light: '#334155',
      dark: '#020617',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
    success: {
      main: '#16a34a',
      light: '#dcfce7',
      dark: '#15803d',
    },
    warning: {
      main: '#f59e0b',
      light: '#fef3c7',
      dark: '#b45309',
    },
    error: {
      main: '#dc2626',
      light: '#fee2e2',
      dark: '#b91c1c',
    },
    info: {
      main: '#0284c7',
      light: '#e0f2fe',
      dark: '#0369a1',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 13,
    h5: {
      fontWeight: 800,
      fontSize: '1.25rem',
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
      fontSize: '0.925rem',
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 700,
      fontSize: '0.825rem',
    },
    subtitle2: {
      fontWeight: 700,
      fontSize: '0.72rem',
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      color: '#64748b',
    },
    body1: {
      fontSize: '0.825rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.45,
    },
    caption: {
      fontSize: '0.7rem',
      color: '#64748b',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 6,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeSmall: {
          padding: '4px 10px',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
          borderRadius: 8,
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          '&:hover': {
            borderColor: '#cbd5e1',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 12,
          '&:last-child': {
            paddingBottom: 12,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '6px 10px',
          fontSize: '0.78rem',
          borderBottom: '1px solid #f1f5f9',
        },
        head: {
          fontWeight: 700,
          backgroundColor: '#f8fafc',
          color: '#475569',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.72rem',
          height: 22,
          borderRadius: 6,
        },
      },
    },
  },
});
