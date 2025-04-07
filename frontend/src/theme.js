// theme.js
import { createTheme } from '@mui/material/styles';

// Функція для створення теми на основі режиму (світлий/темний)
export const createAppTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: mode === 'dark' ? '#f48fb1' : '#f50057',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease-in-out'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s ease-in-out'
          }
        }
      }
    }
  });
};

// Базова світла тема для імпорту в місцях, де не потрібна динамічна тема
const theme = createAppTheme('light');

export default theme;