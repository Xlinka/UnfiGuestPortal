import React from 'react';
import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  width: 100%;
`;

const SpinnerCircle = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.light};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
`;

const SpinnerText = styled.p`
  margin-top: 16px;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
`;

function Spinner({ message = 'Loading...' }) {
  return (
    <SpinnerContainer>
      <SpinnerCircle />
      <SpinnerText>{message}</SpinnerText>
    </SpinnerContainer>
  );
}

export default Spinner;