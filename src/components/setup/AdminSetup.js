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

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 12px;
  margin-top: 4px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  opacity: ${({ disabled }) => disabled ? 0.7 : 1};
  pointer-events: ${({ disabled }) => disabled ? 'none' : 'auto'};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

function AdminSetup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const { api } = useAPI();
  const { showAlert } = useAlert();
  const history = useHistory();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
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
    
    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      // Prepare data for API
      const adminData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      };
      
      // Call API to create admin
      const response = await api.setupAdmin(adminData);
      
      // Store token from response
      if (response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        api.setAuthToken(response.data.token);
      }
      
      showAlert('Admin user created successfully', 'success');
      
      // Navigate to next step
      history.push('/setup/configuration');
    } catch (error) {
      console.error('Error creating admin user:', error);
      showAlert(error.message || 'Error creating admin user', 'danger');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      <FormGroup>
        <Label htmlFor="username">Username *</Label>
        <Input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={!!errors.username}
          required
        />
        {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="email">Email *</Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          required
        />
        {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="password">Password *</Label>
        <Input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          required
        />
        {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <Input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={!!errors.confirmPassword}
          required
        />
        {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="firstName">First Name</Label>
        <Input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
        />
      </FormGroup>
      
      <ButtonContainer>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Admin & Continue'}
        </Button>
      </ButtonContainer>
    </Form>
  );
}

export default AdminSetup;
