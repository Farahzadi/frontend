import { createTheme } from '@material-ui/core/styles';

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
      },
  overrides: {

    MuiPaper: {
      root: {
        backgroundColor: '#23344D',
        color: '#fff',
      },
    },
    MuiPopover: {
      paper: {
        backgroundColor: '#23344D',
      },
    },
    MuiMenuItem: {
      root: {},
    },
    MuiList: {
      root: {
        backgroundColor: '#23344D',
      },
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
                borderBottom: 'none'
            }
        }
    },
    MuiInputBase: {
      root: {
        color: '#fff',
      },
      '& .MuiOutlinedInput': {
        root: {},
      },
      input: {
        color: '#fff',
      },
    },
    MuiSelect: {
      root: {
        color: '#fff',
      },
      icon: {
        color: '#fff',
      },
      select: {
        '&:focus': {

        }
      }
    },
    MuiSvgIcon: {
      root: {
        '& .MuiSelectIcon-root': {
          color: '#fff',
        },
      },
    },
  },
});

export default theme;
