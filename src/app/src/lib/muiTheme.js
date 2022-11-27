import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
  },
  palette: {
    primary: {
      light: '#FCF5ED',
      main: '#0a82b6',
      dark: '#23344D',
    },
    secondary: {
      main: '#071428',
      dark: '#050f1e',
      light: '#14243c'
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#050f1e',
          color: '#fff',
          border: '1px solid #0a82b6',
          borderBottomLeftRadius: '13px',
          borderBottomRightRadius: '13px',
        },
      },
    },
    MuiPopover: {
      paper: {
        backgroundColor: '#23344D',
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          justifyContent: 'center',
          borderBottom: '1px solid #0a82b6',
          '&:hover': {
            backgroundColor: '#23344D'
          },
          '&:last-child': {
            borderBottom: 'none'
          }

        },
      }
    },
    MuiList: {
      styleOverrides: {
        root: {
          paddingTop: '0',
          paddingBottom: '0'
        },
      }

    },
    MuiListItem: {
      root: {
        '& .Mui-selected': {
          backgroundColor: '#23344D',
        },
      },
    },
    MuiInput: {
      underline: {
        '&::after': {
          borderBottom: 'none',
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          color: '#fff'
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#fff'
        },

        '& .MuiOutlinedInput': {
          root: {},
        },
        input: {
          color: '#fff',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          border: 'none'
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          color: '#fff',
        },
        icon: {
          color: '#fff',
        },
        select: {
          '&:focus': {},
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          '& .MuiSelectIcon-root': {
            color: '#fff',
          },
        },
      },
    },
  },
});

export default theme;
