/**
 * Payment Service Factory
 * Factory pattern for creating payment provider instances
 */

const StripeProvider = require('./providers/StripeProvider');
// Future providers will be imported here
// const PayPalProvider = require('./providers/PayPalProvider');

/**
 * Create a payment provider instance based on the provider name
 * @param {String} providerName - The name of the payment provider
 * @param {Object} config - Configuration for the payment provider
 * @returns {Object} - The payment provider instance
 */
const createPaymentProvider = (providerName, config) => {
  if (!providerName) {
    throw new Error('Payment provider name is required');
  }
  
  switch (providerName.toLowerCase()) {
    case 'stripe':
      return new StripeProvider(config);
      
    // case 'paypal':
    //   return new PayPalProvider(config);
      
    default:
      throw new Error(`Payment provider '${providerName}' is not supported`);
  }
};

/**
 * Get all available payment providers
 * @param {Object} paymentsConfig - Configuration for all payment providers
 * @returns {Array} - Array of provider information objects
 */
const getAvailableProviders = (paymentsConfig) => {
  const { activeProviders, providers } = paymentsConfig;
  
  return activeProviders
    .filter(providerName => providers[providerName])
    .map(providerName => {
      try {
        const provider = createPaymentProvider(providerName, providers[providerName]);
        return {
          name: providerName,
          displayName: providerName.charAt(0).toUpperCase() + providerName.slice(1),
          clientConfig: provider.getClientConfig()
        };
      } catch (error) {
        console.error(`Error initializing payment provider ${providerName}:`, error);
        return null;
      }
    })
    .filter(Boolean); // Remove any null entries
};

module.exports = {
  createPaymentProvider,
  getAvailableProviders
};
