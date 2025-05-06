// Configuration for payment providers

module.exports = {
  // List of active payment providers (comma-separated in .env)
  activeProviders: process.env.ACTIVE_PAYMENT_PROVIDERS?.split(',') || ['stripe'],
  
  // Default payment provider
  defaultProvider: process.env.DEFAULT_PAYMENT_PROVIDER || 'stripe',
  
  // Provider-specific configuration
  providers: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      currency: process.env.STRIPE_CURRENCY || 'usd',
      paymentMethods: process.env.STRIPE_PAYMENT_METHODS?.split(',') || ['card'],
    },
    // PayPal configuration for future implementation
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox', // 'sandbox' or 'live'
      currency: process.env.PAYPAL_CURRENCY || 'USD',
    },
    // Add additional payment providers here
  }
};
