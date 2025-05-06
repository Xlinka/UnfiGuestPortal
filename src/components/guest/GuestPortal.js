import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import Spinner from '../common/Spinner';
import Logo from '../common/Logo';

const GuestPortalContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 20px;
`;

const PortalCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 480px;
  padding: 24px;
  margin-top: 40px;
`;

const WelcomeHeader = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.dark};
  text-align: center;
  margin-bottom: 24px;
  font-size: 28px;
`;

const Subtitle = styled.p`
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.secondary};
  text-align: center;
  margin-bottom: 32px;
  font-size: 16px;
`;

const OptionButton = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.light};
  color: ${({ theme }) => theme.colors.dark};
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const OptionIcon = styled.div`
  font-size: 36px;
  margin-bottom: 16px;
`;

const OptionTitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 20px;
  margin-bottom: 8px;
`;

const OptionDescription = styled.p`
  font-family: ${({ theme }) => theme.fonts.main};
  text-align: center;
  font-size: 14px;
`;

const Footer = styled.footer`
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
`;

function GuestPortal() {
  const [loading, setLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const { api } = useAPI();
  const { showAlert } = useAlert();

  useEffect(() => {
    // Flag to track if the component is mounted
    let isMounted = true;
    // Track retry attempts
    let retryCount = 0;
    const maxRetries = 3;
    
    // Get network and device information
    async function fetchInitialData() {
      try {
        if (retryCount >= maxRetries) {
          if (isMounted) {
            showAlert('Failed to connect to the server. Please try again later.', 'danger');
            setLoading(false);
          }
          return;
        }
        
        // Check if API methods exist before calling them
        if (!api.getNetworkInfo || !api.getDeviceInfo) {
          throw new Error('API methods not available');
        }
        
        const [networkResponse, deviceResponse] = await Promise.all([
          api.getNetworkInfo(),
          api.getDeviceInfo()
        ]);
        
        if (isMounted) {
          setNetworkInfo(networkResponse.data);
          setDeviceInfo(deviceResponse.data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        
        // Only show the alert if this is the final retry
        if (retryCount === maxRetries - 1 && isMounted) {
          showAlert('Unable to connect to the network service', 'danger');
          setLoading(false);
        } else if (isMounted) {
          // Retry after a delay
          retryCount++;
          setTimeout(fetchInitialData, 2000); // 2 second delay between retries
        }
      }
    }

    fetchInitialData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [api, showAlert]);

  if (loading) {
    return (
      <GuestPortalContainer>
        <Logo />
        <Spinner message="Connecting to network..." />
      </GuestPortalContainer>
    );
  }

  return (
    <GuestPortalContainer>
      <Logo />
      <PortalCard>
        <WelcomeHeader>
          {networkInfo?.networkName || 'Welcome to WiFi'}
        </WelcomeHeader>
        <Subtitle>
          Please choose an option to access the internet
        </Subtitle>

        <OptionButton to="/purchase">
          <OptionIcon>💳</OptionIcon>
          <OptionTitle>Purchase Access</OptionTitle>
          <OptionDescription>
            Choose from our WiFi plans and pay with a credit/debit card
          </OptionDescription>
        </OptionButton>

        <OptionButton to="/redeem">
          <OptionIcon>🎟️</OptionIcon>
          <OptionTitle>Redeem Voucher</OptionTitle>
          <OptionDescription>
            Enter your voucher code to connect to the network
          </OptionDescription>
        </OptionButton>

        {deviceInfo && (
          <OptionButton to="/device-info">
            <OptionIcon>📱</OptionIcon>
            <OptionTitle>Device Info</OptionTitle>
            <OptionDescription>
              View your device information and connection status
            </OptionDescription>
          </OptionButton>
        )}
      </PortalCard>

      <Footer>
        Powered by UniFi Guest Portal | &copy; {new Date().getFullYear()}
      </Footer>
    </GuestPortalContainer>
  );
}

export default GuestPortal;
