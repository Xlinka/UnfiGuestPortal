import React, { createContext, useContext } from 'react';
import api from '../services/api';

const APIContext = createContext();

export function useAPI() {
  return useContext(APIContext);
}

export function APIProvider({ children }) {
  // Guest API methods
  const getNetworkInfo = () => {
    return api.get('/guest/network-info');
  };
  
  const getDeviceInfo = () => {
    return api.get('/guest/device-info');
  };
  
  const getWifiPlans = () => {
    return api.get('/guest/wifi-plans');
  };
  
  const getWifiPlan = (planId) => {
    return api.get(`/guest/wifi-plans/${planId}`);
  };
  
  const processPayment = (paymentData) => {
    return api.post('/guest/process-payment', paymentData);
  };
  
  const redeemVoucher = (voucherCode) => {
    return api.post('/guest/redeem-voucher', { voucherCode });
  };
  
  const getConnectionInfo = () => {
    return api.get('/guest/connection-info');
  };
  
  const getUsageInfo = () => {
    return api.get('/guest/usage-info');
  };
  
  const disconnectDevice = () => {
    return api.post('/guest/disconnect');
  };
  
  // Admin API methods
  const getDashboardStats = () => {
    return api.get('/admin/dashboard-stats');
  };
  
  const getVouchers = (params) => {
    return api.get('/admin/vouchers', { params });
  };
  
  const createVouchers = (voucherData) => {
    return api.post('/admin/vouchers', voucherData);
  };
  
  const revokeVoucher = (voucherId) => {
    return api.delete(`/admin/vouchers/${voucherId}`);
  };
  
  const batchRevokeVouchers = (voucherIds) => {
    return api.post('/admin/vouchers/batch-revoke', { voucherIds });
  };
  
  const getPaymentHistory = (params) => {
    return api.get('/admin/payments', { params });
  };
  
  const getRefundPayment = (paymentId) => {
    return api.post(`/admin/payments/${paymentId}/refund`);
  };
  
  const getActiveGuests = () => {
    return api.get('/admin/guests/active');
  };
  
  const disconnectGuest = (guestId) => {
    return api.post(`/admin/guests/${guestId}/disconnect`);
  };
  
  const getSystemSettings = () => {
    return api.get('/admin/settings');
  };
  
  const updateSystemSettings = (settings) => {
    return api.put('/admin/settings', settings);
  };
  
  const getPlanSettings = () => {
    return api.get('/admin/plans');
  };
  
  const createPlan = (planData) => {
    return api.post('/admin/plans', planData);
  };
  
  const updatePlan = (planId, planData) => {
    return api.put(`/admin/plans/${planId}`, planData);
  };
  
  const deletePlan = (planId) => {
    return api.delete(`/admin/plans/${planId}`);
  };
  
  const apiMethods = {
    api,
    // Guest methods
    getNetworkInfo,
    getDeviceInfo,
    getWifiPlans,
    getWifiPlan,
    processPayment,
    redeemVoucher,
    getConnectionInfo,
    getUsageInfo,
    disconnectDevice,
    // Admin methods
    getDashboardStats,
    getVouchers,
    createVouchers,
    revokeVoucher,
    batchRevokeVouchers,
    getPaymentHistory,
    getRefundPayment,
    getActiveGuests,
    disconnectGuest,
    getSystemSettings,
    updateSystemSettings,
    getPlanSettings,
    createPlan,
    updatePlan,
    deletePlan
  };
  
  return (
    <APIContext.Provider value={apiMethods}>
      {children}
    </APIContext.Provider>
  );
}