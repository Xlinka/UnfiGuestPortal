import React from 'react';
import styled from 'styled-components';
import { useAlert } from '../../contexts/AlertContext';

const AlertContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 100%;
`;

const AlertItem = styled.div`
  margin-bottom: 10px;
  padding: 12px 16px;
  border-radius: 4px;
  background-color: ${({ theme, type }) => 
    type === 'success' ? theme.colors.success :
    type === 'danger' ? theme.colors.danger :
    type === 'warning' ? theme.colors.warning :
    theme.colors.info
  };
  color: ${({ theme }) => theme.colors.white};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  min-width: 280px;
  max-width: 100%;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const AlertMessage = styled.div`
  flex-grow: 1;
  margin-right: 12px;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 14px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.white};
  font-size: 18px;
  cursor: pointer;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
`;

function Alert() {
  const { alerts, dismissAlert } = useAlert();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <AlertContainer>
      {alerts.map(alert => (
        <AlertItem key={alert.id} type={alert.type}>
          <AlertMessage>{alert.message}</AlertMessage>
          <CloseButton onClick={() => dismissAlert(alert.id)}>×</CloseButton>
        </AlertItem>
      ))}
    </AlertContainer>
  );
}

export default Alert;