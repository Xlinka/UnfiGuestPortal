import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import BackButton from '../common/BackButton';
import Logo from '../common/Logo';

const VoucherContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 20px;
`;

const VoucherCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 480px;
  padding: 24px;
  margin-top: 20px;
`;

const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.dark};
  text-align: center;
  margin: 24px 0;
  font-size: 28px;
`;

const Instructions = styled.p`
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.secondary};
  text-align: center;
  margin-bottom: 24px;
  font-size: 16px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 8px;
`;

const VoucherInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 24px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const RedeemButton = styled.button`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  
  &:hover {
    background-color: ${({ theme, disabled }) => disabled ? theme.colors.secondary : '#005fa3'};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.secondary};
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
`;

function RedeemVoucher() {
  const [voucherCode, setVoucherCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { api } = useAPI();
  const { showAlert } = useAlert();
  const history = useHistory();

  const handleVoucherChange = (e) => {
    setVoucherCode(e.target.value.toUpperCase());
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!voucherCode.trim()) {
      setError('Please enter a voucher code');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      const response = await api.redeemVoucher(voucherCode.trim());
      
      if (response.success) {
        showAlert('Voucher redeemed successfully', 'success');
        history.push('/success/voucher');
      } else {
        throw new Error(response.message || 'Invalid voucher code');
      }
    } catch (error) {
      setError(error.message);
      showAlert('Voucher redemption failed: ' + error.message, 'danger');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <VoucherContainer>
      <Logo />
      <BackButton onClick={() => history.push('/')} />
      <PageTitle>Redeem Voucher</PageTitle>

      <VoucherCard>
        <Instructions>
          Enter your voucher code below to connect to the network
        </Instructions>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="voucher">Voucher Code</Label>
            <VoucherInput
              type="text"
              id="voucher"
              value={voucherCode}
              onChange={handleVoucherChange}
              placeholder="XXXX-XXXX-XXXX"
              maxLength={14}
              autoFocus
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <RedeemButton type="submit" disabled={processing}>
            {processing ? 'Processing...' : 'Connect to WiFi'}
          </RedeemButton>
        </form>
      </VoucherCard>
    </VoucherContainer>
  );
}

export default RedeemVoucher;