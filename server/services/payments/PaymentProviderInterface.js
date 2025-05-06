/**
 * Payment Provider Interface
 * Abstract class that all payment providers must implement
 */
class PaymentProviderInterface {
  /**
   * Initialize a payment intent
   * @param {Number} amount - The payment amount
   * @param {String} currency - The currency code (e.g., 'usd', 'eur')
   * @param {Object} metadata - Additional metadata for the payment
   * @returns {Promise<Object>} - Payment intent data
   */
  async createPaymentIntent(amount, currency, metadata) {
    throw new Error('createPaymentIntent method must be implemented by the payment provider');
  }

  /**
   * Process a payment
   * @param {String} paymentId - The provider-specific payment ID
   * @param {Object} data - Additional data needed to process the payment
   * @returns {Promise<Object>} - Payment result
   */
  async processPayment(paymentId, data) {
    throw new Error('processPayment method must be implemented by the payment provider');
  }

  /**
   * Get payment status
   * @param {String} paymentId - The provider-specific payment ID
   * @returns {Promise<Object>} - Payment status information
   */
  async getPaymentStatus(paymentId) {
    throw new Error('getPaymentStatus method must be implemented by the payment provider');
  }

  /**
   * Refund a payment
   * @param {String} paymentId - The provider-specific payment ID
   * @param {Number} amount - The amount to refund (optional, defaults to full amount)
   * @param {String} reason - The reason for the refund (optional)
   * @returns {Promise<Object>} - Refund result
   */
  async refundPayment(paymentId, amount, reason) {
    throw new Error('refundPayment method must be implemented by the payment provider');
  }

  /**
   * Handle webhook events from the payment provider
   * @param {Object} payload - The webhook payload
   * @param {String} signature - The webhook signature for validation
   * @returns {Promise<Object>} - Webhook processing result
   */
  async handleWebhook(payload, signature) {
    throw new Error('handleWebhook method must be implemented by the payment provider');
  }

  /**
   * Get client-side config needed for the payment form
   * @returns {Object} - Client configuration (API keys, etc.)
   */
  getClientConfig() {
    throw new Error('getClientConfig method must be implemented by the payment provider');
  }

  /**
   * Validate payment configuration
   * @returns {Boolean} - True if the configuration is valid
   */
  validateConfig() {
    throw new Error('validateConfig method must be implemented by the payment provider');
  }
}

module.exports = PaymentProviderInterface;
