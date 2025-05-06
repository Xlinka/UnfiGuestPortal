import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import Logo from '../common/Logo';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 20px;
`;

const LoginCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  padding: 24px;
  margin-top: 40px;
`;

const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.dark};
  text-align: center;
  margin-bottom: 24px;
  font-size: 28px;
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

const LoginButton = styled.button`
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
  margin-top: 16px;
  
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
  margin-top: 16px;
  text-align: center;
`;

const HomeLink = styled.div`
  margin-top: 16px;
  text-align: center;
`;

const Link = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

function AdminLogin() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { login } = useAuth();
  const { showAlert } = useAlert();
  const history = useHistory();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await login(credentials.username, credentials.password);
      
      if (result.success) {
        showAlert('Login successful', 'success');
        history.push('/admin/dashboard');
      } else {
        throw new Error(result.message || 'Invalid credentials');
      }
    } catch (error) {
      setError(error.message);
      showAlert('Login failed: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPortal = () => {
    history.push('/');
  };

  return (
    <LoginContainer>
      <Logo />
      <LoginCard>
        <PageTitle>Admin Login</PageTitle>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="username">Username</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <LoginButton type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </LoginButton>
        </form>

        <HomeLink>
          <Link onClick={handleGuestPortal}>
            Back to Guest Portal
          </Link>
        </HomeLink>
      </LoginCard>
    </LoginContainer>
  );
}

export default AdminLogin;