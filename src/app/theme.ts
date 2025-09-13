
import { createTheme } from '@mui/material/styles';

export const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light Mode Palette (Clean & Professional)
          primary: { main: '#1976d2' }, // Standard Material Blue
          secondary: { main: '#dc004e' }, // Standard Material Pink
          background: {
            default: '#f4f6f8', // Light gray background
            paper: '#ffffff', // White for cards/surfaces
          },
          text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
          },
        }
      : {
          // Dark Mode Palette (Expressive - Option C)
          primary: { 
            main: '#00BCD4', // Cool Teal-Blue
            light: '#5EDFE4',
            dark: '#00838F',
            contrastText: '#FFFFFF',
          }, 
          secondary: {
            main: '#AB47BC', // Desaturated Violet
            light: '#DF78EF',
            dark: '#7B1FA2',
            contrastText: '#FFFFFF',
          },
          background: {
            default: '#1A1A2E', // Very dark grey with subtle cool tint
            paper: '#24243F', // Slightly lighter for elevated surfaces
          },
          text: {
            primary: '#E0E0E0', // Light grey, not pure white
            secondary: '#B0B0B0', // Dimmer grey
            disabled: 'rgba(255, 255, 255, 0.38)',
          },
          // Define state colors for dark mode
          success: { main: '#66BB6A' },
          warning: { main: '#FFA726' },
          error: { main: '#EF5350' },
          info: { main: '#29B6F6' },
          divider: 'rgba(255, 255, 255, 0.12)',
        }),
  },
  typography: {
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    // Avoid pure white for body text
    body1: {
      color: '#E0E0E0', // Light grey
    },
    body2: {
      color: '#B0B0B0', // Dimmer grey
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          ...(mode === 'light' ? { backgroundColor: '#1976d2' } : { backgroundColor: '#1A1A2E' }), // Match background.default
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          ...(mode === 'light' ? { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' } : { boxShadow: '0px 2px 4px rgba(0,0,0,0.2)' }),
          backgroundColor: mode === 'dark' ? '#24243F' : undefined, // Ensure paper background matches
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          // Example of state tokens (MUI handles most automatically)
          // '&:hover': { backgroundColor: 'rgba(0, 188, 212, 0.08)' },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          // Ensure text color is visible in dark mode
          color: mode === 'dark' ? '#B0B0B0' : undefined, // Dimmer grey for inactive tabs
          '&.Mui-selected': {
            color: mode === 'dark' ? '#00BCD4' : undefined, // Teal-blue for selected tabs
          },
        },
      },
    },
  },
});
