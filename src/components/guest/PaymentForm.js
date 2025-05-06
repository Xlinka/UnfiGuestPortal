import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import BackButton from '../common/BackButton';
import Spinner from '../common/Spinner';
import Logo from '../common/Logo';

const PaymentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 20px;
`;

const PaymentCard = styled.div`
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

const PlanSummary = styled.div`
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 24px;
`;

const PlanName = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 20px;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 8px;
`;

const PlanDetail = styled.p`
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 4px;
`;

const PlanPrice = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 24px;
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 8px;
  text-align: right;
`;

const CardContainer = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: ${({ theme }) => theme.fonts.main};
  font-size: 16px;
`;

const PayButton = styled.button`
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
`;

function PaymentForm() {
  const { planId } = useParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [error, setError] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    name: ''
  });
  
  const stripe = useStripe();
  const elements = useElements();
  const { api } = useAPI();
  const { showAlert } = useAlert();
  const history = useHistory();

  useEffect(() => {
    async function fetchData() {
      try {
        const [planResponse, deviceResponse] = await Promise.all([
          api.getWifiPlan(planId),
          api.getDeviceInfo()
        ]);
        
        setPlan(planResponse.data);
        setDeviceInfo(deviceResponse.data);
      } catch (error) {
        showAlert('Error loading plan information', 'danger');
        console.error('Error fetching data:', error);
        history.push('/purchase');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [api, planId, showAlert, history]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    // Validate form
    if (!customerInfo.email || !customerInfo.name) {
      setError('Please fill in all required fields');
      setProcessing(false);
      return;
    }
    
    try {
      // Create a payment method
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: customerInfo.name,
          email: customerInfo.email
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Process the payment
      const response = await api.processPayment({
        planId: plan.id,
        paymentMethodId: paymentMethod.id,
        deviceMac: deviceInfo.macAddress,
        customerInfo
      });
      
      if (response.success) {
        showAlert('Payment successful', 'success');
        history.push('/success/payment');
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (error) {
      setError(error.message);
      showAlert('Payment failed: ' + error.message, 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (cents) => {
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}`;
  };

  if (loading) {
    return (
      <PaymentContainer>
        <Logo />
        <Spinner message="Loading payment information..." />
      </PaymentContainer>
    );
  }

  return (
    <PaymentContainer>
      <Logo />
      <BackButton onClick={() => history.push('/purchase')} />
      <PageTitle>Complete Your Purchase</PageTitle>

      <PaymentCard>
        <PlanSummary>
          <PlanName>{plan.name}</PlanName>
          <PlanDetail>{plan.durationHours} hours of access</PlanDetail>
          {plan.dataLimitMB && (
            <PlanDetail>{(plan.dataLimitMB / 1024).toFixed(1)} GB data limit</PlanDetail>
          )}
          <PlanPrice>{formatPrice(plan.priceInCents)}</PlanPrice>
        </PlanSummary>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Full Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={customerInfo.name}
              onChange={handleInputChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={customerInfo.email}
              onChange={handleInputChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Card Details</Label>
            <CardContainer>
              <CardElement options={{
                style: {
                  base: {
                    fontSize: '16px',
                    fontFamily: 'Roboto, sans-serif',
                  }
                }
              }} />
            </CardContainer>
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <PayButton type="submit" disabled={!stripe || processing}>
            {processing ? 'Processing...' : `Pay ${formatPrice(plan.priceInCents)}`}
          </PayButton>
        </form>
      </PaymentCard>
    </PaymentContainer>
  );
}

export default PaymentForm;