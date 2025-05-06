/**
 * Stripe Webhook Handler
 * Processes webhook events from Stripe
 */

const Payment = require('../../../models/Payment');
const Guest = require('../../../models/Guest');
const Plan = require('../../../models/Plan');
const { createPaymentProvider } = require('../index');
const config = require('../../../config/config');

/**
 * Process a Stripe webhook event
 * @param {Object} event - The Stripe event object
 * @returns {Promise<Object>} - The processing result
 */
async function processStripeWebhook(event) {
  const { type, data: { object } } = event;
  
  console.log(`Processing Stripe webhook event: ${type}`);
  
  try {
    switch (type) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(object);
        
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(object);
        
      case 'charge.refunded':
        return await handleChargeRefunded(object);
        
      case 'payment_method.attached':
        // Optional: Handle payment method attachment
        return { status: 'success', message: 'Payment method attached' };
        
      default:
        // Log but don't error on unhandled event types
        console.log(`Unhandled Stripe webhook event type: ${type}`);
        return { status: 'ignored', message: `Event type '${type}' not handled` };
    }
  } catch (error) {
    console.error(`Error processing Stripe webhook event ${type}:`, error);
    throw new Error(`Failed to process Stripe webhook: ${error.message}`);
  }
}

/**
 * Handle a successful payment intent
 * @param {Object} paymentIntent - The Stripe payment intent object
 * @returns {Promise<Object>} - The processing result
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // Find the payment record in our database
    const payment = await Payment.findOne({ 
      provider: 'stripe',
      providerPaymentId: paymentIntent.id
    });
    
    if (!payment) {
      console.error(`Payment not found for Stripe payment intent ${paymentIntent.id}`);
      return { 
        status: 'error', 
        message: 'Payment record not found in database' 
      };
    }
    
    // Update payment status
    await payment.updateStatus('succeeded', paymentIntent);
    
    // If we have a plan ID, authorize the guest
    if (payment.planId) {
      // Get the plan to determine access duration
      const plan = await Plan.findById(payment.planId);
      
      if (!plan) {
        console.error(`Plan not found for payment ${payment._id}`);
        return {
          status: 'partial',
          message: 'Payment processed but plan not found',
          paymentId: payment._id
        };
      }
      
      // Find or create guest record
      let guest;
      
      if (payment.guestId) {
        guest = await Guest.findById(payment.guestId);
      }
      
      if (!guest && payment.customer?.email) {
        // Try to find by MAC address from payment metadata
        const mac = paymentIntent.metadata?.mac;
        
        if (mac) {
          guest = await Guest.findOne({ mac });
        }
        
        if (!guest) {
          // Create a new guest record with available information
          guest = new Guest({
            mac: mac || 'unknown',
            email: payment.customer.email,
            ip: payment.customer.ipAddress,
            accessType: 'payment',
            paymentId: payment._id,
            planId: payment.planId
          });
          
          await guest.save();
          
          // Update payment with new guest ID
          payment.guestId = guest._id;
          await payment.save();
        }
      }
      
      if (guest) {
        // Calculate expiration based on plan duration
        const now = new Date();
        const expirationDate = new Date(now);
        
        // Use getDurationInSeconds from Plan model
        const durationInSeconds = plan.getDurationInSeconds();
        expirationDate.setSeconds(expirationDate.getSeconds() + durationInSeconds);
        
        // Update guest with authorization details
        guest.authorized = true;
        guest.authorizedAt = now;
        guest.expiresAt = expirationDate;
        guest.status = 'authorized';
        await guest.save();
        
        // TODO: Authorize guest with UniFi controller
        // This would be implemented in the UniFi service
        
        return {
          status: 'success',
          message: 'Payment processed and guest authorized',
          paymentId: payment._id,
          guestId: guest._id
        };
      } else {
        return {
          status: 'partial',
          message: 'Payment processed but guest not found/created',
          paymentId: payment._id
        };
      }
    }
    
    return { 
      status: 'success', 
      message: 'Payment processed successfully',
      paymentId: payment._id
    };
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw new Error(`Failed to handle successful payment: ${error.message}`);
  }
}

/**
 * Handle a failed payment intent
 * @param {Object} paymentIntent - The Stripe payment intent object
 * @returns {Promise<Object>} - The processing result
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    // Find the payment record in our database
    const payment = await Payment.findOne({ 
      provider: 'stripe',
      providerPaymentId: paymentIntent.id
    });
    
    if (!payment) {
      console.error(`Payment not found for Stripe payment intent ${paymentIntent.id}`);
      return { 
        status: 'error', 
        message: 'Payment record not found in database' 
      };
    }
    
    // Update payment status to failed
    await payment.updateStatus('failed', {
      error: paymentIntent.last_payment_error,
      paymentIntent
    });
    
    return { 
      status: 'success', 
      message: 'Payment failure recorded',
      paymentId: payment._id
    };
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
    throw new Error(`Failed to handle failed payment: ${error.message}`);
  }
}

/**
 * Handle a refunded charge
 * @param {Object} charge - The Stripe charge object
 * @returns {Promise<Object>} - The processing result
 */
async function handleChargeRefunded(charge) {
  try {
    // Get the payment intent ID from the charge
    const paymentIntentId = charge.payment_intent;
    
    if (!paymentIntentId) {
      return { 
        status: 'error', 
        message: 'No payment intent ID found in charge' 
      };
    }
    
    // Find the payment record in our database
    const payment = await Payment.findOne({ 
      provider: 'stripe',
      providerPaymentId: paymentIntentId
    });
    
    if (!payment) {
      console.error(`Payment not found for Stripe payment intent ${paymentIntentId}`);
      return { 
        status: 'error', 
        message: 'Payment record not found in database' 
      };
    }
    
    // Check if fully or partially refunded
    const status = charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded';
    
    // Update payment with refund information
    await payment.updateStatus(status, {
      refund: {
        amount: charge.amount_refunded / 100, // Convert from cents
        date: new Date(),
        chargeId: charge.id
      },
      charge
    });
    
    // If guest is associated and fully refunded, revoke access
    if (payment.guestId && status === 'refunded') {
      const guest = await Guest.findById(payment.guestId);
      
      if (guest && guest.accessType === 'payment' && guest.paymentId.equals(payment._id)) {
        guest.authorized = false;
        guest.status = 'disconnected';
        guest.disconnectedAt = new Date();
        await guest.save();
        
        // TODO: Deauthorize guest with UniFi controller
        // This would be implemented in the UniFi service
      }
    }
    
    return { 
      status: 'success', 
      message: `Payment ${status}`,
      paymentId: payment._id
    };
  } catch (error) {
    console.error('Error handling charge.refunded:', error);
    throw new Error(`Failed to handle refund: ${error.message}`);
  }
}

module.exports = {
  processStripeWebhook
};
