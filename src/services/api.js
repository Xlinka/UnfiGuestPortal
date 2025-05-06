import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3881/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      // Redirect to login if needed
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      'Something went wrong';
      
    return Promise.reject(new Error(errorMessage));
  }
);

// API service
const api = {
  // Set auth token for requests
  setAuthToken: (token) => {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  
  // Clear auth token
  clearAuthToken: () => {
    delete apiClient.defaults.headers.common['Authorization'];
  },
  
  // Generic methods
  get: (url, config = {}) => {
    return apiClient.get(url, config);
  },
  
  post: (url, data = {}, config = {}) => {
    return apiClient.post(url, data, config);
  },
  
  put: (url, data = {}, config = {}) => {
    return apiClient.put(url, data, config);
  },
  
  delete: (url, config = {}) => {
    return apiClient.delete(url, config);
  },
  
  // Auth methods
  login: (username, password) => {
    return apiClient.post('/auth/login', { username, password });
  },
  
  getCurrentUser: () => {
    return apiClient.get('/auth/me');
  },
  
  // Setup methods
  getSetupStatus: () => {
    return apiClient.get('/setup/status');
  },
  
  setupAdmin: (adminData) => {
    return apiClient.post('/setup/admin', adminData);
  },
  
  setupConfiguration: (configData) => {
    return apiClient.post('/setup/configuration', configData);
  },
  
  // Admin methods
  getAdminDashboardStats: () => {
    return apiClient.get('/admin/dashboard');
  },
  
  initializeSampleData: () => {
    return apiClient.post('/admin/sample-data');
  },
  
  // Guests management
  getAllGuests: (params) => {
    return apiClient.get('/admin/guests', { params });
  },
  
  getGuest: (id) => {
    return apiClient.get(`/admin/guests/${id}`);
  },
  
  authorizeGuest: (id, data) => {
    return apiClient.post(`/admin/guests/${id}/authorize`, data);
  },
  
  unauthorizeGuest: (id) => {
    return apiClient.post(`/admin/guests/${id}/unauthorize`);
  },
  
  // Guest portal
  getGuestInfo: (mac) => {
    return apiClient.get('/guest/info', { params: { mac } });
  },
  
  getDeviceInfo: () => {
    return apiClient.get('/guest/device-info');
  },
  
  getNetworkInfo: () => {
    return apiClient.get('/guest/network-info');
  },
  
  redeemVoucher: (code, mac) => {
    return apiClient.post('/guest/redeem-voucher', { code, mac });
  },
  
  getAvailablePlans: () => {
    return apiClient.get('/guest/plans');
  }
};

export default api;
