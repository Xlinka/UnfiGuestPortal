import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import BackButton from '../common/BackButton';
import Spinner from '../common/Spinner';
import Logo from '../common/Logo';

const PlanContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 20px;
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  width: 100%;
  max-width: 960px;
  margin-top: 20px;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const PlanCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
`;

const PlanName = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 24px;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 16px;
`;

const PlanPrice = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 32px;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 16px;
`;

const PlanFeatureList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin-bottom: 24px;
  flex-grow: 1;
`;

const PlanFeature = styled.li`
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 16px;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  
  &:before {
    content: "✓";
    color: ${({ theme }) => theme.colors.success};
    margin-right: 8px;
  }
`;

const SelectButton = styled.button`
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

const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.dark};
  text-align: center;
  margin: 24px 0;
  font-size: 28px;
`;

function PurchasePlan() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const { api } = useAPI();
  const { showAlert } = useAlert();
  const history = useHistory();

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await api.getWifiPlans();
        setPlans(response.data.filter(plan => plan.active));
      } catch (error) {
        showAlert('Error loading WiFi plans', 'danger');
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, [api, showAlert]);

  const handleSelectPlan = (planId) => {
    history.push(`/payment/${planId}`);
  };

  const formatPrice = (cents) => {
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}`;
  };

  if (loading) {
    return (
      <PlanContainer>
        <Logo />
        <Spinner message="Loading WiFi plans..." />
      </PlanContainer>
    );
  }

  return (
    <PlanContainer>
      <Logo />
      <BackButton onClick={() => history.push('/')} />
      <PageTitle>Select a WiFi Plan</PageTitle>

      <PlansGrid>
        {plans.map((plan) => (
          <PlanCard key={plan.id}>
            <PlanName>{plan.name}</PlanName>
            <PlanPrice>{formatPrice(plan.priceInCents)}</PlanPrice>
            <PlanFeatureList>
              <PlanFeature>{plan.durationHours} hours of access</PlanFeature>
              {plan.dataLimitMB && (
                <PlanFeature>{(plan.dataLimitMB / 1024).toFixed(1)} GB data limit</PlanFeature>
              )}
              {plan.downloadSpeedKbps && (
                <PlanFeature>{(plan.downloadSpeedKbps / 1024).toFixed(1)} Mbps download speed</PlanFeature>
              )}
              {plan.uploadSpeedKbps && (
                <PlanFeature>{(plan.uploadSpeedKbps / 1024).toFixed(1)} Mbps upload speed</PlanFeature>
              )}
              <PlanFeature>Connect up to {plan.maxDevices || 1} device(s)</PlanFeature>
            </PlanFeatureList>
            <SelectButton onClick={() => handleSelectPlan(plan.id)}>
              Select Plan
            </SelectButton>
          </PlanCard>
        ))}
      </PlansGrid>
    </PlanContainer>
  );
}

export default PurchasePlan;