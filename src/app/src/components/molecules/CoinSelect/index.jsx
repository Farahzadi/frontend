import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  TextField,
  autocompleteClasses,
} from '@mui/material';
import api from 'lib/api';
import { useSelector } from 'react-redux';
import { networkSelector } from 'lib/store/features/api/apiSlice';
import { userSelector } from 'lib/store/features/auth/authSlice';
import { FiChevronDown } from 'react-icons/fi';
import { styled } from '@mui/material/styles';
import { ClickAwayListener, Popper } from '@mui/material';

const CoinBtn = styled('button')(() => ({
  width: '175px',
  border: 'none',
  paddingRight: '13px',
  paddingLeft: '7px',
  height: '52px',
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: 'white',
  borderTopLeftRadius: '24px',
  borderBottomLeftRadius: '24px',
  fontSize: '1.2rem',
  textAlign: 'start',
  '& img': {
    marginInlineEnd: '7px',
    marginInlineStart: '5px',
  },
  '& svg': {
    position: 'absolute',
    right: '10px',
    left: 'auto',
    top: 'calc(50% - 10.2px)',
  },
}));
const Title = styled('div')(({theme}) => ({
  padding: '10px',
  fontSize: '0.9rem',
  borderBottom: `1px solid ${theme.palette.primary.main}`,
}));
const StyledAutocompletePopper = styled('div')(({ theme }) => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: 'none',
    margin: 0,
    color: 'white',
    fontSize: 13,
    backgroundColor: theme.palette.secondary.dark,
  },
  [`& .${autocompleteClasses.listbox}`]: {
    backgroundColor: 'inherit',
    padding: 0,
    maxHeight: '221px',
    [`& .${autocompleteClasses.option}`]: {
      minHeight: 'auto',
      alignItems: 'flex-start',
      padding: '13px 7px',
      color: 'white',
      fontSize: '1rem',
      '& img': {
        marginInline: '7px 11px',
      },
      '&[aria-selected="true"]': {
      },
      [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focused}[aria-selected="true"]`]:
        {
          backgroundColor: theme.palette.action.hover,
        },
    },
  },
  [`&.${autocompleteClasses.popperDisablePortal}`]: {
    position: 'relative',
  },
  [`&.${autocompleteClasses.paper}`]: {},
}));

const StyledPopper = styled(Popper)(({ theme }) => ({
  border: `1px solid ${theme.palette.primary.main}`,
  boxShadow: `0 8px 24px rgba(149, 157, 165, 0.2)`,
  borderRadius: 10,
  width: 173,
  zIndex: theme.zIndex.modal,
  fontSize: 13,
  color: 'white',
  backgroundColor: theme.palette.secondary.dark,
}));
const StyledInput = styled(TextField)(({ theme }) => ({
  width: '100%',
  borderBottom: `1px solid ${theme.palette.primary.main}`,
  color: 'white',
  '& input': {
    borderRadius: 15,
    color: 'white',
    padding: 8,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    fontSize: 14,
    '&:focus': {
      borderColor: '#3f4851',
      outline: 'none',
    },
  },
}));

function PopperComponent(props: PopperComponentProps) {
  const { disablePortal, anchorEl, open, ...other } = props;
  return <StyledAutocompletePopper {...other} />;
}
const CoinSelect = ({ currency, handleCurrencyChange }) => {
  const [input, setInput] = useState('');
  const [coin, setCoin] = useState('');
  const [tickers, setTickers] = useState([]);
  const [anchorEl, setAnchorEl] = useState();
  const [open, setOpen] = useState(false);
  const network = useSelector(networkSelector);
  const user = useSelector(userSelector);
  useEffect(() => {
    const tickers = Object.keys(api.currencies)
      .filter((c) => {
        return api.currencies[c].chain[network];
      })
      .sort();
    setTickers(tickers);
  }, [user.id, network]);
  useEffect(() => {
    if (currency) {
      setCoin(api.currencies[currency]);
    }
  }, [currency]);
  const searchCoins = (event, newValue) => {
    setInput(newValue);
  };
  const handleChange = (event, newValue, reason) => {
    if (newValue) {
      handleCurrencyChange(newValue);
      setOpen(false);

    }
  };
  return (
    <>
      <CoinBtn
        type='button'
        onClick={(event) => {
          setOpen(!open);
          setAnchorEl(event.currentTarget);
        }}
      >
        {currency && (
          <img
            src={api.currencies[currency]?.image?.default}
            alt={coin?.name}
            width={23}
            height={23}
          />
        )}
        <span>{coin?.name}</span>
        <FiChevronDown />
      </CoinBtn>
      <StyledPopper
        id='select-coin-popper'
        open={open}
        anchorEl={anchorEl}
        placement='bottom-start'
      >
        <ClickAwayListener
          onClickAway={() => {
            setOpen(false);
          }}
        >
          <div>
            <Title>Select a token</Title>
            <Autocomplete
              open
              value={''}
              onChange={handleChange}
              inputValue={input}
              onInputChange={searchCoins}
              id='coin-select'
              options={tickers || []}
              getOptionLabel={(val) => val}
              renderOption={(props, val) => (
                <div {...props}>
                  <img
                    src={api.currencies[val].image.default}
                    alt={api.currencies[val]?.name}
                    width={23}
                    height={23}
                  />
                  <span>{val}</span>
                </div>
              )}
              renderInput={(params) => (
                <StyledInput
                  placeholder='Search'
                  {...params}
                  value={params.inputProps.value}
                  autoComplete='new-password'
                />
              )}
              PopperComponent={PopperComponent}
            />
          </div>
        </ClickAwayListener>
      </StyledPopper>
    </>
  );
};
export default CoinSelect;
