const PaymentProviderInterface = require('../PaymentProviderInterface');
const stripe = require('stripe');

/**
 * Stripe Payment Provider implementation
 */
class StripeProvider extends PaymentProviderInterface {
  /**
   * Initialize the Stripe provider with configuration
   * @param {Object} config - Stripe configuration
   */
  constructor(config) {
    super();
    
    if (!config?.secretKey) {
      throw new Error('Stripe secret key is required');
    }
    
    this.config = config;
    this.stripe = stripe(config.secretKey);
    
    // Validate configuration on instantiation
    if (!this.validateConfig()) {
      throw new Error('Invalid Stripe configuration');
    }
  }
  
  /**
   * Create a payment intent with Stripe
   * @param {Number} amount - The payment amount
   * @param {String} currency - The currency code (e.g., 'usd', 'eur')
   * @param {Object} metadata - Additional metadata for the payment
   * @returns {Promise<Object>} - Payment intent data
   */
  async createPaymentIntent(amount, currency, metadata = {}) {
    try {
      // Convert amount to cents (Stripe expects amounts in the smallest currency unit)
      const amountInCents = Math.round(amount * 100);
      
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata,
        payment_method_types: this.config.paymentMethods || ['card'],
      });
      
      // Return a standardized format with necessary client-side data
      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        currency: currency,
        status: paymentIntent.status,
        clientData: {
          clientSecret: paymentIntent.client_secret,
          publishableKey: this.config.publishableKey
        }
      };
    } catch (error) {
      console.error('Stripe createPaymentIntent error:', error);
      throw new Error(`Failed to create Stripe payment intent: ${error.message}`);
    }
  }
  
  /**
   * Process a payment (typically handled client-side with Stripe)
   * @param {String} paymentIntentId - The Stripe payment intent ID
   * @param {Object} data - Additional data
   * @returns {Promise<Object>} - Payment result
   */
  async processPayment(paymentIntentId, data = {}) {
    try {
      // For Stripe, most payment processing happens client-side
      // We just need to retrieve the payment intent to get its status
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert back from cents
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        processingResult: paymentIntent
      };
    } catch (error) {
      console.error('Stripe processPayment error:', error);
      throw new Error(`Failed to process Stripe payment: ${error.message}`);
    }
  }
  
  /**
   * Get payment status from Stripe
   * @param {String} paymentIntentId - The Stripe payment intent ID
   * @returns {Promise<Object>} - Payment status information
   */
  async getPaymentStatus(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Map Stripe status to our system's status
      let status;
      switch (paymentIntent.status) {
        case 'succeeded':
          status = 'succeeded';
          break;
        case 'processing':
          status = 'processing';
          break;
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
        case 'requires_capture':
          status = 'initialized';
          break;
        case 'canceled':
          status = 'failed';
          break;
        default:
          status = 'unknown';
      }
      
      return {
        id: paymentIntent.id,
        status,
        providerStatus: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      console.error('Stripe getPaymentStatus error:', error);
      throw new Error(`Failed to get Stripe payment status: ${error.message}`);
    }
  }
  
  /**
   * Refund a payment through Stripe
   * @param {String} paymentIntentId - The Stripe payment intent ID
   * @param {Number} amount - Amount to refund (optional, defaults to full amount)
   * @param {String} reason - Reason for the refund (optional)
   * @returns {Promise<Object>} - Refund result
   */
  async refundPayment(paymentIntentId, amount = null, reason = null) {
    try {
      // Get the payment intent to find the associated charge
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent.latest_charge) {
        throw new Error('No charge found for this payment intent');
      }
      
      // Build refund parameters
      const refundParams = {
        charge: paymentIntent.latest_charge,
        reason: reason || 'requested_by_customer'
      };
      
      // If amount is specified, convert to cents and add to params
      if (amount !== null) {
        refundParams.amount = Math.round(amount * 100);
      }
      
      // Process the refund
      const refund = await this.stripe.refunds.create(refundParams);
      
      return {
        id: refund.id,
        paymentIntentId,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        refundResult: refund
      };
    } catch (error) {
      console.error('Stripe refundPayment error:', error);
      throw new Error(`Failed to process Stripe refund: ${error.message}`);
    }
  }
  
  /**
   * Handle Stripe webhook events
   * @param {Object} payload - Raw request body
   * @param {String} signature - Stripe signature from headers
   * @returns {Promise<Object>} - Event processing result
   */
  async handleWebhook(payload, signature) {
    try {
      if (!this.config.webhookSecret) {
        throw new Error('Stripe webhook secret is not configured');
      }
      
      // Verify and construct the event
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.webhookSecret
      );
      
      // Return standardized event data
      return {
        id: event.id,
        type: event.type,
        object: event.data.object,
        event
      };
    } catch (error) {
      console.error('Stripe webhook processing error:', error);
      throw new Error(`Failed to process Stripe webhook: ${error.message}`);
    }
  }
  
  /**
   * Get client-side configuration for Stripe integration
   * @returns {Object} - Client configuration
   */
  getClientConfig() {
    return {
      provider: 'stripe',
      publishableKey: this.config.publishableKey,
      paymentMethods: this.config.paymentMethods || ['card']
    };
  }
  
  /**
   * Validate the Stripe configuration
   * @returns {Boolean} - True if configuration is valid
   */
  validateConfig() {
    if (!this.config.secretKey) {
      console.error('Missing Stripe secret key');
      return false;
    }
    
    if (!this.config.publishableKey) {
      console.error('Missing Stripe publishable key');
      return false;
    }
    
    // Perform a simple API call to verify the keys work
    try {
      this.stripe.paymentMethods.list({ limit: 1 });
      return true;
    } catch (error) {
      console.error('Stripe configuration validation failed:', error);
      return false;
    }
  }
}

module.exports = StripeProvider;
