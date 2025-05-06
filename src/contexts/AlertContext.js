import React, { createContext, useContext, useState } from 'react';

const AlertContext = createContext();

export function useAlert() {
  return useContext(AlertContext);
}

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (message, type = 'info', timeout = 5000) => {
    const id = Date.now();
    setAlerts(prevAlerts => [...prevAlerts, { id, message, type }]);
    
    // Auto dismiss after timeout
    if (timeout > 0) {
      setTimeout(() => {
        dismissAlert(id);
      }, timeout);
    }
    
    return id;
  };
  
  const dismissAlert = (id) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
  };
  
  const value = {
    alerts,
    showAlert,
    dismissAlert
  };
  
  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
}