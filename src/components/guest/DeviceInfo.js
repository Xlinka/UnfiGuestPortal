import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import BackButton from '../common/BackButton';
import Spinner from '../common/Spinner';
import Logo from '../common/Logo';

const DeviceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 20px;
`;

const DeviceCard = styled.div`
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

const StatusBadge = styled.div`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
  
  background-color: ${({ theme, status }) => 
    status === 'connected' ? theme.colors.success :
    status === 'limited' ? theme.colors.warning :
    theme.colors.danger
  };
  
  color: ${({ theme }) => theme.colors.white};
`;

const InfoSection = styled.div`
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 18px;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 12px;
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

const DataUsageBar = styled.div`
  height: 8px;
  width: 100%;
  background-color: #e9ecef;
  border-radius: 4px;
  margin-top: 8px;
  overflow: hidden;
`;

const DataUsageFill = styled.div`
  height: 100%;
  width: ${({ percent }) => `${percent}%`};
  background-color: ${({ theme, percent }) =>
    percent < 70
      ? theme.colors.success
      : percent < 90
      ? theme.colors.warning
      : theme.colors.danger
  };
  border-radius: 4px;
`;

const UsageLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.secondary};
  margin-top: 4px;
`;

const Button = styled.button`
  width: 100%;
  background-color: ${({ theme, secondary }) => secondary ? theme.colors.secondary : theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  margin-bottom: 8px;
  
  &:hover {
    background-color: ${({ theme, secondary }) => secondary ? '#5a6268' : '#005fa3'};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.secondary};
    cursor: not-allowed;
  }
`;

function DeviceInfo() {
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const { api } = useAPI();
  const { showAlert } = useAlert();
  const history = useHistory();

  useEffect(() => {
    async function fetchData() {
      try {
        const [deviceResponse, connectionResponse, usageResponse] = await Promise.all([
          api.getDeviceInfo(),
          api.getConnectionInfo(),
          api.getUsageInfo()
        ]);
        
        setDeviceInfo(deviceResponse.data);
        setConnectionInfo(connectionResponse.data);
        setUsageInfo(usageResponse.data);
      } catch (error) {
        showAlert('Error loading device information', 'danger');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [api, showAlert]);

  const handlePurchaseMore = () => {
    history.push('/purchase');
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectDevice();
      showAlert('You have been disconnected from the network', 'success');
      history.push('/');
    } catch (error) {
      showAlert('Error disconnecting from the network', 'danger');
      console.error('Error disconnecting:', error);
    }
  };

  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds) return 'Expired';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    }
    
    return `${minutes}m ${seconds % 60}s remaining`;
  };

  const formatDataUsage = (used, total) => {
    if (used < 1024 && total < 1024) {
      return `${used.toFixed(1)} MB of ${total.toFixed(1)} MB`;
    }
    
    const usedGB = used / 1024;
    const totalGB = total / 1024;
    
    return `${usedGB.toFixed(1)} GB of ${totalGB.toFixed(1)} GB`;
  };

  const getConnectionStatus = () => {
    if (!connectionInfo) return 'disconnected';
    
    if (connectionInfo.expired) return 'expired';
    
    if (connectionInfo.dataLimitReached) return 'limited';
    
    return 'connected';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'limited':
        return 'Data Limit Reached';
      case 'expired':
        return 'Session Expired';
      default:
        return 'Disconnected';
    }
  };

  if (loading) {
    return (
      <DeviceContainer>
        <Logo />
        <Spinner message="Loading device information..." />
      </DeviceContainer>
    );
  }

  const connectionStatus = getConnectionStatus();
  const dataUsagePercent = usageInfo ? (usageInfo.dataUsedMB / usageInfo.dataLimitMB) * 100 : 0;

  return (
    <DeviceContainer>
      <Logo />
      <BackButton onClick={() => history.push('/')} />
      <PageTitle>Device Information</PageTitle>

      <DeviceCard>
        <StatusBadge status={connectionStatus}>
          {getStatusLabel(connectionStatus)}
        </StatusBadge>

        <InfoSection>
          <SectionTitle>Device Details</SectionTitle>
          <InfoRow>
            <InfoLabel>Device Name:</InfoLabel>
            <InfoValue>{deviceInfo.deviceName}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>MAC Address:</InfoLabel>
            <InfoValue>{deviceInfo.macAddress}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>IP Address:</InfoLabel>
            <InfoValue>{deviceInfo.ipAddress}</InfoValue>
          </InfoRow>
        </InfoSection>

        {connectionInfo && connectionStatus !== 'disconnected' && (
          <>
            <InfoSection>
              <SectionTitle>Connection Details</SectionTitle>
              <InfoRow>
                <InfoLabel>Connected Since:</InfoLabel>
                <InfoValue>
                  {new Date(connectionInfo.connectedSince).toLocaleString()}
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Expires At:</InfoLabel>
                <InfoValue>
                  {new Date(connectionInfo.expiresAt).toLocaleString()}
                </InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Time Remaining:</InfoLabel>
                <InfoValue>
                  {formatTimeRemaining(connectionInfo.remainingTime)}
                </InfoValue>
              </InfoRow>
            </InfoSection>

            {usageInfo && usageInfo.dataLimitMB > 0 && (
              <InfoSection>
                <SectionTitle>Data Usage</SectionTitle>
                <InfoRow>
                  <InfoLabel>Data Used:</InfoLabel>
                  <InfoValue>
                    {formatDataUsage(usageInfo.dataUsedMB, usageInfo.dataLimitMB)}
                  </InfoValue>
                </InfoRow>
                <DataUsageBar>
                  <DataUsageFill percent={Math.min(dataUsagePercent, 100)} />
                </DataUsageBar>
                <UsageLabel>
                  <span>0</span>
                  <span>{(usageInfo.dataLimitMB / 1024).toFixed(1)} GB</span>
                </UsageLabel>
              </InfoSection>
            )}
          </>
        )}

        {connectionStatus === 'connected' ? (
          <Button secondary onClick={handleDisconnect}>
            Disconnect from Network
          </Button>
        ) : (
          <Button onClick={handlePurchaseMore}>
            Purchase Access
          </Button>
        )}
      </DeviceCard>
    </DeviceContainer>
  );
}

export default DeviceInfo;