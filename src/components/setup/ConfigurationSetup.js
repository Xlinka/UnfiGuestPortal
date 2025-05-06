import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.dark};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${({ theme, error }) => error ? theme.colors.danger : theme.colors.light};
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}33;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const Checkbox = styled.input`
  margin-right: 8px;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.dark};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 12px;
  margin-top: 4px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.light};
  padding-bottom: 8px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 12px;
`;

const Button = styled.button`
  background-color: ${({ theme, secondary }) => secondary ? theme.colors.light : theme.colors.primary};
  color: ${({ theme, secondary }) => secondary ? theme.colors.dark : theme.colors.white};
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  opacity: ${({ disabled }) => disabled ? 0.7 : 1};
  pointer-events: ${({ disabled }) => disabled ? 'none' : 'auto'};
  
  &:hover {
    background-color: ${({ theme, secondary }) => secondary ? '#e2e6ea' : theme.colors.primaryDark};
  }
`;

function ConfigurationSetup() {
  const [formData, setFormData] = useState({
    // Portal settings
    portalName: 'UniFi Guest Portal',
    
    // UniFi controller settings
    unifiUrl: 'https://unifi.example.com',
    unifiPort: '8443',
    unifiUsername: '',
    unifiPassword: '',
    unifiSite: 'default',
    unifiVerifyCertificate: false,
    
    // Payment provider settings
    stripeSecretKey: '',
    stripePublishableKey: '',
    stripeWebhookSecret: '',
    
    // Sample data
    createSampleData: true
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const { api } = useAPI();
  const { showAlert } = useAlert();
  const history = useHistory();
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    // Validate portal name
    if (!formData.portalName) {
      newErrors.portalName = 'Portal name is required';
    }
    
    // Validate UniFi controller URL
    if (!formData.unifiUrl) {
      newErrors.unifiUrl = 'UniFi controller URL is required';
    } else if (!/^https?:\/\//.test(formData.unifiUrl)) {
      newErrors.unifiUrl = 'URL must start with http:// or https://';
    }
    
    // Optional validations for payment provider
    if (formData.stripeSecretKey && !formData.stripeSecretKey.startsWith('sk_')) {
      newErrors.stripeSecretKey = 'Invalid Stripe secret key';
    }
    
    if (formData.stripePublishableKey && !formData.stripePublishableKey.startsWith('pk_')) {
      newErrors.stripePublishableKey = 'Invalid Stripe publishable key';
    }
    
    if (formData.stripeWebhookSecret && !formData.stripeWebhookSecret.startsWith('whsec_')) {
      newErrors.stripeWebhookSecret = 'Invalid Stripe webhook secret';
    }
    
    return newErrors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = validate();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare configuration data
      const configData = {
        portalName: formData.portalName,
        unifiController: {
          url: formData.unifiUrl,
          port: formData.unifiPort,
          username: formData.unifiUsername,
          password: formData.unifiPassword,
          site: formData.unifiSite,
          verifyCertificate: formData.unifiVerifyCertificate
        },
        defaultSettings: formData.createSampleData
      };
      
      // Add payment provider if configured
      if (formData.stripeSecretKey || formData.stripePublishableKey) {
        configData.paymentProviders = {
          stripe: {
            secretKey: formData.stripeSecretKey,
            publishableKey: formData.stripePublishableKey,
            webhookSecret: formData.stripeWebhookSecret
          }
        };
      }
      
      // Call API to set up configuration
      await api.setupConfiguration(configData);
      
      showAlert('System configuration saved successfully', 'success');
      
      // Navigate to completed setup
      history.push('/admin/dashboard');
    } catch (error) {
      console.error('Error saving configuration:', error);
      showAlert(error.message || 'Error saving configuration', 'danger');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      <SectionTitle>Portal Settings</SectionTitle>
      <FormGroup>
        <Label htmlFor="portalName">Portal Name *</Label>
        <Input
          type="text"
          id="portalName"
          name="portalName"
          value={formData.portalName}
          onChange={handleChange}
          error={!!errors.portalName}
          required
        />
        {errors.portalName && <ErrorMessage>{errors.portalName}</ErrorMessage>}
      </FormGroup>
      
      <SectionTitle>UniFi Controller Configuration</SectionTitle>
      <FormGroup>
        <Label htmlFor="unifiUrl">Controller URL *</Label>
        <Input
          type="text"
          id="unifiUrl"
          name="unifiUrl"
          value={formData.unifiUrl}
          onChange={handleChange}
          error={!!errors.unifiUrl}
          placeholder="https://unifi.example.com"
          required
        />
        {errors.unifiUrl && <ErrorMessage>{errors.unifiUrl}</ErrorMessage>}
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="unifiPort">Controller Port</Label>
        <Input
          type="text"
          id="unifiPort"
          name="unifiPort"
          value={formData.unifiPort}
          onChange={handleChange}
          placeholder="8443"
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="unifiUsername">Username</Label>
        <Input
          type="text"
          id="unifiUsername"
          name="unifiUsername"
          value={formData.unifiUsername}
          onChange={handleChange}
          placeholder="admin"
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="unifiPassword">Password</Label>
        <Input
          type="password"
          id="unifiPassword"
          name="unifiPassword"
          value={formData.unifiPassword}
          onChange={handleChange}
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="unifiSite">Site Name</Label>
        <Input
          type="text"
          id="unifiSite"
          name="unifiSite"
          value={formData.unifiSite}
          onChange={handleChange}
          placeholder="default"
        />
      </FormGroup>
      
      <CheckboxContainer>
        <Checkbox
          type="checkbox"
          id="unifiVerifyCertificate"
          name="unifiVerifyCertificate"
          checked={formData.unifiVerifyCertificate}
          onChange={handleChange}
        />
        <CheckboxLabel htmlFor="unifiVerifyCertificate">
          Verify SSL Certificate
        </CheckboxLabel>
      </CheckboxContainer>
      
      <SectionTitle>Payment Integration (Optional)</SectionTitle>
      <FormGroup>
        <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
        <Input
          type="text"
          id="stripeSecretKey"
          name="stripeSecretKey"
          value={formData.stripeSecretKey}
          onChange={handleChange}
          error={!!errors.stripeSecretKey}
          placeholder="sk_test_..."
        />
        {errors.stripeSecretKey && <ErrorMessage>{errors.stripeSecretKey}</ErrorMessage>}
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
        <Input
          type="text"
          id="stripePublishableKey"
          name="stripePublishableKey"
          value={formData.stripePublishableKey}
          onChange={handleChange}
          error={!!errors.stripePublishableKey}
          placeholder="pk_test_..."
        />
        {errors.stripePublishableKey && <ErrorMessage>{errors.stripePublishableKey}</ErrorMessage>}
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="stripeWebhookSecret">Stripe Webhook Secret</Label>
        <Input
          type="text"
          id="stripeWebhookSecret"
          name="stripeWebhookSecret"
          value={formData.stripeWebhookSecret}
          onChange={handleChange}
          error={!!errors.stripeWebhookSecret}
          placeholder="whsec_..."
        />
        {errors.stripeWebhookSecret && <ErrorMessage>{errors.stripeWebhookSecret}</ErrorMessage>}
      </FormGroup>
      
      <SectionTitle>Sample Data</SectionTitle>
      <CheckboxContainer>
        <Checkbox
          type="checkbox"
          id="createSampleData"
          name="createSampleData"
          checked={formData.createSampleData}
          onChange={handleChange}
        />
        <CheckboxLabel htmlFor="createSampleData">
          Initialize with sample plans and settings
        </CheckboxLabel>
      </CheckboxContainer>
      
      <ButtonContainer>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Complete Setup'}
        </Button>
      </ButtonContainer>
    </Form>
  );
}

export default ConfigurationSetup;
