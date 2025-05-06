import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAPI } from '../../contexts/APIContext';
import { useAlert } from '../../contexts/AlertContext';
import AdminLayout from './components/AdminLayout';
import Spinner from '../common/Spinner';

const Container = styled.div`
  padding: 20px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.dark};
`;

const SettingsCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 20px;
`;

const CardHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.light};
  background-color: ${({ theme }) => theme.colors.light};
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.dark};
`;

const CardBody = styled.div`
  padding: 16px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.dark};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(0, 119, 204, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(0, 119, 204, 0.2);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(0, 119, 204, 0.2);
  }
`;

const Checkbox = styled.input`
  margin-right: 8px;
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: #0069d9;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    portalName: '',
    portalLogo: '',
    portalWelcomeText: '',
    termsAndConditions: '',
    networkName: '',
    networkPassphrase: '',
    allowGuestSignup: false,
    requireEmail: true,
    redirectAfterLogin: false,
    redirectUrl: '',
    stripePublicKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    currency: 'USD',
    unifiControllerUrl: '',
    unifiUsername: '',
    unifiPassword: '',
    unifiSite: 'default',
    unifiInsecure: true
  });
  
  const { api } = useAPI();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.getSystemSettings();
      setSettings(response.data);
    } catch (error) {
      showAlert('Error loading settings', 'danger');
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.updateSystemSettings(settings);
      showAlert('Settings updated successfully', 'success');
    } catch (error) {
      showAlert('Error updating settings: ' + error.message, 'danger');
      console.error('Error updating settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container>
          <Spinner message="Loading system settings..." />
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container>
        <PageHeader>
          <PageTitle>System Settings</PageTitle>
        </PageHeader>

        <form onSubmit={handleSubmit}>
          <SettingsCard>
            <CardHeader>
              <CardTitle>Portal Settings</CardTitle>
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label htmlFor="portalName">Portal Name</Label>
                <Input 
                  type="text"
                  id="portalName"
                  name="portalName"
                  value={settings.portalName}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="portalLogo">Logo URL</Label>
                <Input 
                  type="text"
                  id="portalLogo"
                  name="portalLogo"
                  value={settings.portalLogo}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="portalWelcomeText">Welcome Text</Label>
                <Textarea 
                  id="portalWelcomeText"
                  name="portalWelcomeText"
                  value={settings.portalWelcomeText}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                <Textarea 
                  id="termsAndConditions"
                  name="termsAndConditions"
                  value={settings.termsAndConditions}
                  onChange={handleInputChange}
                />
              </FormGroup>
            </CardBody>
          </SettingsCard>
          
          <SettingsCard>
            <CardHeader>
              <CardTitle>Network Settings</CardTitle>
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label htmlFor="networkName">Network Name (SSID)</Label>
                <Input 
                  type="text"
                  id="networkName"
                  name="networkName"
                  value={settings.networkName}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="networkPassphrase">Network Passphrase</Label>
                <Input 
                  type="password"
                  id="networkPassphrase"
                  name="networkPassphrase"
                  value={settings.networkPassphrase}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>
                  <Checkbox 
                    type="checkbox"
                    name="allowGuestSignup"
                    checked={settings.allowGuestSignup}
                    onChange={handleInputChange}
                  />
                  Allow Guest Sign-up (without vouchers)
                </Label>
              </FormGroup>
              
              <FormGroup>
                <Label>
                  <Checkbox 
                    type="checkbox"
                    name="requireEmail"
                    checked={settings.requireEmail}
                    onChange={handleInputChange}
                  />
                  Require Email for Guests
                </Label>
              </FormGroup>
              
              <FormGroup>
                <Label>
                  <Checkbox 
                    type="checkbox"
                    name="redirectAfterLogin"
                    checked={settings.redirectAfterLogin}
                    onChange={handleInputChange}
                  />
                  Redirect After Login
                </Label>
              </FormGroup>
              
              {settings.redirectAfterLogin && (
                <FormGroup>
                  <Label htmlFor="redirectUrl">Redirect URL</Label>
                  <Input 
                    type="text"
                    id="redirectUrl"
                    name="redirectUrl"
                    value={settings.redirectUrl}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              )}
            </CardBody>
          </SettingsCard>
          
          <SettingsCard>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                <Input 
                  type="text"
                  id="stripePublicKey"
                  name="stripePublicKey"
                  value={settings.stripePublicKey}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                <Input 
                  type="password"
                  id="stripeSecretKey"
                  name="stripeSecretKey"
                  value={settings.stripeSecretKey}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="stripeWebhookSecret">Stripe Webhook Secret</Label>
                <Input 
                  type="password"
                  id="stripeWebhookSecret"
                  name="stripeWebhookSecret"
                  value={settings.stripeWebhookSecret}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  id="currency"
                  name="currency"
                  value={settings.currency}
                  onChange={handleInputChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </Select>
              </FormGroup>
            </CardBody>
          </SettingsCard>
          
          <SettingsCard>
            <CardHeader>
              <CardTitle>UniFi Controller Settings</CardTitle>
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label htmlFor="unifiControllerUrl">Controller URL</Label>
                <Input 
                  type="text"
                  id="unifiControllerUrl"
                  name="unifiControllerUrl"
                  value={settings.unifiControllerUrl}
                  onChange={handleInputChange}
                  placeholder="https://192.168.1.1:8443"
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="unifiUsername">Username</Label>
                <Input 
                  type="text"
                  id="unifiUsername"
                  name="unifiUsername"
                  value={settings.unifiUsername}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="unifiPassword">Password</Label>
                <Input 
                  type="password"
                  id="unifiPassword"
                  name="unifiPassword"
                  value={settings.unifiPassword}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="unifiSite">Site</Label>
                <Input 
                  type="text"
                  id="unifiSite"
                  name="unifiSite"
                  value={settings.unifiSite}
                  onChange={handleInputChange}
                  placeholder="default"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>
                  <Checkbox 
                    type="checkbox"
                    name="unifiInsecure"
                    checked={settings.unifiInsecure}
                    onChange={handleInputChange}
                  />
                  Allow Insecure Connection (Skip SSL Verification)
                </Label>
              </FormGroup>
            </CardBody>
          </SettingsCard>
          
          <ButtonGroup>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </ButtonGroup>
        </form>
      </Container>
    </AdminLayout>
  );
}

export default SystemSettings;