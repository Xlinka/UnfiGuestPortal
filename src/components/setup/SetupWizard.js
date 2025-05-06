import React, { useState, useEffect } from 'react';
import { Switch, Route, Redirect, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import AdminSetup from './AdminSetup';
import ConfigurationSetup from './ConfigurationSetup';
import Spinner from '../common/Spinner';
import Logo from '../common/Logo';

const SetupContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 40px 20px;
`;

const SetupCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  padding: 40px;
  margin-top: 40px;
`;

const WelcomeHeader = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.dark};
  text-align: center;
  margin-bottom: 24px;
  font-size: 28px;
`;

const SubHeader = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
  margin-bottom: 32px;
  font-size: 20px;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 16px;
`;

const StepCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${({ active, completed, theme }) => 
    completed ? theme.colors.success : 
    active ? theme.colors.primary : 
    theme.colors.light};
  color: ${({ active, completed, theme }) => 
    (completed || active) ? theme.colors.white : theme.colors.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 8px;
`;

const StepLabel = styled.span`
  font-size: 14px;
  color: ${({ active, completed, theme }) => 
    completed ? theme.colors.success : 
    active ? theme.colors.primary : 
    theme.colors.secondary};
`;

const StepDivider = styled.div`
  height: 2px;
  background-color: ${({ completed, theme }) => 
    completed ? theme.colors.success : theme.colors.light};
  width: 60px;
  margin-top: 16px;
`;

function SetupWizard() {
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState(null);
  const { api } = useAPI();
  const { showAlert } = useAlert();
  const history = useHistory();

  useEffect(() => {
    async function checkSetupStatus() {
      try {
        const response = await api.getSetupStatus();
        setSetupStatus(response.data);
        
        // Redirect to the correct step
        if (response.data.setupStep === 'admin') {
          history.replace('/setup/admin');
        } else if (response.data.setupStep === 'configuration') {
          history.replace('/setup/configuration');
        } else if (response.data.setupStep === 'complete') {
          // Setup is complete, redirect to the main app
          history.replace('/');
        }
      } catch (error) {
        showAlert('Error checking setup status', 'danger');
        console.error('Error checking setup status:', error);
      } finally {
        setLoading(false);
      }
    }

    checkSetupStatus();
  }, [api, history, showAlert]);

  if (loading) {
    return (
      <SetupContainer>
        <Logo />
        <Spinner message="Checking setup status..." />
      </SetupContainer>
    );
  }

  // If setup is complete, redirect to the main app
  if (setupStatus && setupStatus.setupStep === 'complete') {
    return <Redirect to="/" />;
  }

  // Determine active step
  const currentStep = history.location.pathname.includes('/admin') ? 1 : 2;

  return (
    <SetupContainer>
      <Logo />
      <SetupCard>
        <WelcomeHeader>Welcome to UniFi Guest Portal</WelcomeHeader>
        <SubHeader>Initial Setup</SubHeader>
        
        <StepIndicator>
          <Step>
            <StepCircle active={currentStep === 1} completed={currentStep > 1}>1</StepCircle>
            <StepLabel active={currentStep === 1} completed={currentStep > 1}>Admin Setup</StepLabel>
          </Step>
          
          <StepDivider completed={currentStep > 1} />
          
          <Step>
            <StepCircle active={currentStep === 2} completed={currentStep > 2}>2</StepCircle>
            <StepLabel active={currentStep === 2} completed={currentStep > 2}>Configuration</StepLabel>
          </Step>
        </StepIndicator>
        
        <Switch>
          <Route path="/setup/admin" component={AdminSetup} />
          <Route path="/setup/configuration" component={ConfigurationSetup} />
          <Redirect to="/setup/admin" />
        </Switch>
      </SetupCard>
    </SetupContainer>
  );
}

export default SetupWizard;
