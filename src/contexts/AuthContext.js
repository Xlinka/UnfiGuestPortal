import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check for stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      api.setAuthToken(token);
      
      // Verify token validity by fetching user info
      api.getCurrentUser()
        .then(response => {
          if (response.success) {
            setCurrentUser(response.data);
          } else {
            // Invalid token, clear it
            localStorage.removeItem('authToken');
            api.clearAuthToken();
          }
        })
        .catch(error => {
          console.error('Error validating token:', error);
          localStorage.removeItem('authToken');
          api.clearAuthToken();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);
  
  // Login function
  const login = async (username, password) => {
    try {
      const response = await api.login(username, password);
      
      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        api.setAuthToken(response.token);
        setCurrentUser(response.user);
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    api.clearAuthToken();
    setCurrentUser(null);
  };
  
  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}