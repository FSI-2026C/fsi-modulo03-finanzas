import { createTheme } from '@mui/material/styles';

export const financeTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F2942',
      light: '#1E466E',
      dark: '#091A2B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0D9488',
      light: '#14B8A6',
      dark: '#0F766E',
    },
    success: {
      main: '#15803D',
      light: '#DCFCE7',
    },
    warning: {
      main: '#B45309',
      light: '#FEF3C7',
    },
    error: {
      main: '#B91C1C',
      light: '#FEE2E2',
    },
    background: {
      default: '#F4F6F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        outlined: {
          borderColor: '#E2E8F0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#F8FAFC',
          color: '#334155',
          borderBottom: '1px solid #CBD5E1',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 52,
        },
      },
    },
  },
});
