import React from 'react';
import { Slider } from '@mui/material';
import { styled } from '@mui/material/styles';

const DexSlider = styled(Slider)(({ theme }) => ({
    padding: '0',
    height: '6px',
    position: 'relative',
    cursor: 'pointer',
    width: '100%',
    display: 'inline-block',
    boxSizing: 'content-box',
    touchAction: 'none',
    '& .MuiSlider-rail': {
        backgroundColor: '#6c768c',
    },

  '& .MuiSlider-mark': {
    top: '50%',
    width: '12px',
    height: '12px',
    opacity: '1',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    borderRadius: ' 50%',
    backgroundColor: '#6c768c',
    boxSizing: 'unset',
    '&:before': {
      content: "''",
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '6px',
      height: '6px',
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      backgroundColor: '#212f44',
      boxSizing: 'unset',
    },
  },
  '& .MuiSlider-thumb': {
    backgroundColor: '#e1e1e1',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    outline: 0,
    position: 'absolute',
    boxSizing: 'border-box',
    border: '1px solid #000',
    transition: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    '&::after': {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      backgroundColor: theme.palette.secondary.light,
      content: '""',
      width: '10px',
      height: '10px',
    },
  },
  '&:focus, &:hover, &.Mui-active': {
    boxShadow: 'none !important',
  },
}));

const marks = [
  { value: 0 },
  { value: 25 },
  { value: 50 },
  { value: 75 },
  { value: 100 },
];
export const RangeSlider = (props) => {
  return (
    <>
      <DexSlider
        defaultValue={0}
        aria-labelledby='discrete-slider-always'
        step={1}
        marks={marks}
        value={props.value}
        onChange={props.onChange}
      />
    </>
  );
};
