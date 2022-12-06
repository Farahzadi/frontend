import CoinSelect from 'components/molecules/CoinSelect';
import React, { useEffect, useState } from 'react';
import { ALLOWANCE_INFO } from './data';
import styled from '@xstyled/styled-components';
import { DefaultTemplate } from 'components/templates/DefaultTemplate';
import { Button } from 'components/atoms/Button';
import { useSelector } from 'react-redux';
import { balancesSelector } from 'lib/store/features/api/apiSlice';
import { validateNumberInputs } from 'lib/utils';
import api from 'lib/api';
const Container = styled.div`
  justify-content: center;
  display: flex;
  align-items: center;
  min-height: 80vh;
`;
const InnerContainer = styled.div`
  padding: 1.25em;
  max-width: 765px;
  min-height: 337px;
  margin: 2.5rem auto;
  background-color: #dadbdc;
  border-radius: 2rem;
`;
const Header = styled.h2`
  margin-bottom: 0.5em;
  text-align: center;
`;
const Paragraph = styled.p`
  margin-bottom: 1.2rem;
  text-align: justify;
  max-height: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  padding-bottom: 7px;
`;
const Ellipsis = styled.span`
  position: absolute;
  left: auto;
  right: 0;
  bottom: 0;
  padding: 2px 5px;
  background-color: #43434370;
  cursor: pointer;
  color: white;
  border-radius: 3px;
`;
const InputContainer = styled.div`
  margin-bottom: 0.5rem;
  display: flex;
  flex-flow: row;
  border: 2px solid var(--purple);
  border-radius: 24px;
  background-color: white;
`;
const FormContainer = styled.div`
  display: flex;
  justify-content: center;
`;
const Input = styled.input`
  border: none;
  height: 52px;
  min-width: 160px;
  text-align: right;
  border-top-right-radius: 24px;
  border-bottom-right-radius: 24px;
  border-left: 2px solid var(--purple);
  padding: 0.3rem 1.2rem;
  font-size: 1.25rem;
  &:focus {
    outline: none;
  }
`;
const Diff = styled.div`
  margin-bottom: 0.25rem;
  text-align: center;
  font-size: 0.95rem;
  & span {
    font-weight: bold;
  }
`;
const BtnContainer = styled.div`
  margin-top: 1.2rem;
`;

const Allowance = () => {
  const balance = useSelector(balancesSelector)?.wallet;
  const [allowance, setAllowance] = useState('');
  const [preAllowance, setPreAllowance] = useState();
  const [truncated, setTruncated] = useState(true);
  const [allowanceInfo, setAllowanceInfo] = useState(true);
  const [currency, setCurrency] = useState('ETH');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (currency) {
      setAllowance(balance?.[currency]?.allowance?.hex?.toString() || '');
      setPreAllowance(+balance?.[currency]?.allowance?.hex?.toString() || '');
    }
  }, [currency]);
  useEffect(() => {
    if (truncated) {
      setAllowanceInfo(ALLOWANCE_INFO.substring(0, 550) + '...');
    } else {
      setAllowanceInfo(ALLOWANCE_INFO.substring(0, ALLOWANCE_INFO.length - 1));
    }
  }, [truncated]);
  const handleCurrencyChange = (value) => {
    setCurrency(value);
  };
  const handleSetAllowance = (e) => {
    const value = validateNumberInputs(e.target.value);
    setAllowance(value);
  };
  const handleSubmitAllowance = async () => {
    setPending(true);
    await api.approveSpendOfCurrency(currency, allowance).catch(err => {
      console.log(err)
    }).finally(() => {
      setPending(false);
    });
  };
  return (
    <DefaultTemplate>
      <Container>
        <InnerContainer>
          <Header>Change Allowance Setting</Header>
          <Paragraph>
            {allowanceInfo}
            <Ellipsis
              onClick={() => {
                setTruncated(!truncated);
              }}
            >
              {truncated ? 'Read more >' : ' < Close '}
            </Ellipsis>
          </Paragraph>
          <FormContainer>
            <InputContainer>
              <CoinSelect
                handleCurrencyChange={handleCurrencyChange}
                currency={currency}
              />

              <Input
                type='text'
                placeholder='0.00'
                value={allowance}
                onChange={handleSetAllowance}
              />
            </InputContainer>
          </FormContainer>

            <Diff>
              {+allowance !== +preAllowance ? (
                <div>
                  {` You're about to ${
                    allowance > preAllowance ? 'increase' : 'decrease'
                  } your allowance by `}
                  <span>{Math.abs(allowance - preAllowance) || 0}</span>{' '}
                  {currency}
                </div>
              ) : (
                <span> Allowance has not been changed. </span>
              )}
            </Diff>
          <BtnContainer>
            <Button
              text='Accept'
              className='bg_btn'
              disabled={pending || allowance === preAllowance}
              loading={pending}
              onClick={handleSubmitAllowance}
            />
          </BtnContainer>
        </InnerContainer>
      </Container>
    </DefaultTemplate>
  );
};
export default Allowance;
