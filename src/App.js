import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Setup components
import SetupWizard from './components/setup/SetupWizard';

// Guest portal components
import GuestPortal from './components/guest/GuestPortal';
import PurchasePlan from './components/guest/PurchasePlan';
import RedeemVoucher from './components/guest/RedeemVoucher';
import PaymentForm from './components/guest/PaymentForm';
import SuccessPage from './components/guest/SuccessPage';
import DeviceInfo from './components/guest/DeviceInfo';

// Admin panel components
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import VoucherManagement from './components/admin/VoucherManagement';
import PaymentHistory from './components/admin/PaymentHistory';
import GuestManagement from './components/admin/GuestManagement';
import SystemSettings from './components/admin/SystemSettings';
import PlanSettings from './components/admin/PlanSettings';

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { APIProvider } from './contexts/APIContext';
import { AlertProvider } from './contexts/AlertContext';

// Utility components
import PrivateRoute from './components/common/PrivateRoute';
import Alert from './components/common/Alert';

// Theme
import theme from './theme';

// Load stripe outside of component to avoid recreating stripe object on render
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function App() {
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  
  useEffect(() => {
    // Check if the application needs setup
    const checkSetupStatus = async () => {
      try {
        // We'll check if any admin users exist by trying to load a file that
        // would only exist after setup. If we get a 404, we know setup is needed.
        const response = await fetch('/api/setup/status');
        const data = await response.json();
        
        if (data.data && data.data.needsSetup) {
          setNeedsSetup(true);
        }
      } catch (error) {
        console.error('Error checking setup status:', error);
        // If we can't check, assume we don't need setup
      } finally {
        setCheckingSetup(false);
      }
    };
    
    checkSetupStatus();
  }, []);
  
  // Show loading state while checking setup
  if (checkingSetup) {
    return <div>Loading...</div>;
  }
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <APIProvider>
          <AlertProvider>
            <Elements stripe={stripePromise}>
              <Router>
                <Alert />
                <Switch>
                  {/* Setup Routes */}
                  <Route path="/setup" component={SetupWizard} />
                  
                  {/* Redirect to setup if needed */}
                  {needsSetup && <Redirect from="/" to="/setup" />}
                  
                  {/* Guest Portal Routes */}
                  <Route exact path="/" component={GuestPortal} />
                  <Route path="/purchase" component={PurchasePlan} />
                  <Route path="/redeem" component={RedeemVoucher} />
                  <Route path="/payment/:planId" component={PaymentForm} />
                  <Route path="/success/:type" component={SuccessPage} />
                  <Route path="/device-info" component={DeviceInfo} />
                  
                  {/* Admin Panel Routes */}
                  <Route path="/admin/login" component={AdminLogin} />
                  <PrivateRoute path="/admin/dashboard" component={AdminDashboard} />
                  <PrivateRoute path="/admin/vouchers" component={VoucherManagement} />
                  <PrivateRoute path="/admin/payments" component={PaymentHistory} />
                  <PrivateRoute path="/admin/guests" component={GuestManagement} />
                  <PrivateRoute path="/admin/settings" component={SystemSettings} />
                  <PrivateRoute path="/admin/plans" component={PlanSettings} />
                  
                  {/* Redirect unknown routes back to the home page */}
                  <Redirect to="/" />
                </Switch>
              </Router>
            </Elements>
          </AlertProvider>
        </APIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
