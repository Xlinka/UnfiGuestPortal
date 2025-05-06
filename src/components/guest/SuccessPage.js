import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import Logo from '../common/Logo';

const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 20px;
`;

const SuccessCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 480px;
  padding: 24px;
  margin-top: 40px;
  text-align: center;
`;

const SuccessIcon = styled.div`
  font-size: 72px;
  margin-bottom: 24px;
`;

const SuccessTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.success};
  margin-bottom: 16px;
  font-size: 28px;
`;

const SuccessMessage = styled.p`
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 24px;
  font-size: 16px;
`;

const ConnectionInfoBox = styled.div`
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const InfoLabel = styled.span`
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
`;

const InfoValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.dark};
  font-weight: 500;
`;

const Button = styled.button`
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
    background-color: ${({ theme }) => theme.colors.secondary};
  }
`;

function SuccessPage() {
  const { type } = useParams();
  const [connectionInfo, setConnectionInfo] = useState(null);
  const { api } = useAPI();
  const history = useHistory();

  useEffect(() => {
    async function fetchConnectionInfo() {
      try {
        const response = await api.getConnectionInfo();
        setConnectionInfo(response.data);
      } catch (error) {
        console.error('Error fetching connection info:', error);
      }
    }

    fetchConnectionInfo();
  }, [api]);

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  };

  const formatDataLimit = (megabytes) => {
    if (megabytes < 1024) {
      return `${megabytes} MB`;
    }
    
    return `${(megabytes / 1024).toFixed(1)} GB`;
  };

  const formatSpeed = (kbps) => {
    if (kbps < 1000) {
      return `${kbps} Kbps`;
    }
    
    return `${(kbps / 1000).toFixed(1)} Mbps`;
  };

  const handleBackHome = () => {
    history.push('/');
  };

  return (
    <SuccessContainer>
      <Logo />
      <SuccessCard>
        <SuccessIcon>✅</SuccessIcon>
        <SuccessTitle>
          {type === 'payment' ? 'Payment Successful' : 'Voucher Redeemed'}
        </SuccessTitle>
        <SuccessMessage>
          {type === 'payment' 
            ? 'Your payment has been processed successfully.' 
            : 'Your voucher has been redeemed successfully.'
          }
          <br />
          You are now connected to the network!
        </SuccessMessage>

        {connectionInfo && (
          <ConnectionInfoBox>
            <InfoRow>
              <InfoLabel>Status:</InfoLabel>
              <InfoValue>Connected</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Duration:</InfoLabel>
              <InfoValue>{formatDuration(connectionInfo.durationMinutes)}</InfoValue>
            </InfoRow>
            {connectionInfo.dataLimitMB && (
              <InfoRow>
                <InfoLabel>Data Limit:</InfoLabel>
                <InfoValue>{formatDataLimit(connectionInfo.dataLimitMB)}</InfoValue>
              </InfoRow>
            )}
            <InfoRow>
              <InfoLabel>Download Speed:</InfoLabel>
              <InfoValue>{formatSpeed(connectionInfo.downloadSpeedKbps)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Upload Speed:</InfoLabel>
              <InfoValue>{formatSpeed(connectionInfo.uploadSpeedKbps)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Expires:</InfoLabel>
              <InfoValue>
                {new Date(connectionInfo.expiresAt).toLocaleString()}
              </InfoValue>
            </InfoRow>
          </ConnectionInfoBox>
        )}

        <Button onClick={handleBackHome}>Back to Home</Button>
      </SuccessCard>
    </SuccessContainer>
  );
}

export default SuccessPage;