/**
 * Payment Controller
 * Handles payment processing and management for multiple payment providers
 */

const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const Guest = require('../models/Guest');
const { createPaymentProvider, getAvailableProviders } = require('../services/payments');
const config = require('../config/config');
const unifiService = require('../services/unifi/unifiService');

/**
 * @route   GET /api/payments/providers
 * @desc    Get available payment providers
 * @access  Public
 */
exports.getPaymentProviders = async (req, res, next) => {
  try {
    const availableProviders = getAvailableProviders(config.payments);
    
    res.status(200).json({
      success: true,
      data: {
        providers: availableProviders,
        defaultProvider: config.payments.defaultProvider
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/initialize
 * @desc    Initialize a payment intent
 * @access  Public
 */
exports.initializePayment = async (req, res, next) => {
  try {
    const { planId, paymentMethod = config.payments.defaultProvider, customerInfo = {} } = req.body;
    
    // Validate plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    // Ensure plan is active
    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected plan is not currently available'
      });
    }
    
    // Get client MAC address from request
    const clientMac = req.body.mac || req.headers['x-client-mac'] || 'unknown';
    
    // Create payment provider instance
    const provider = createPaymentProvider(
      paymentMethod,
      config.payments.providers[paymentMethod]
    );
    
    // Initialize payment with the provider
    const paymentIntent = await provider.createPaymentIntent(
      plan.price,
      plan.currency,
      {
        planId: plan._id.toString(),
        planName: plan.name,
        mac: clientMac,
        customerEmail: customerInfo.email,
        ipAddress: req.ip
      }
    );
    
    // Create payment record in database
    const payment = new Payment({
      amount: plan.price,
      currency: plan.currency,
      status: 'initialized',
      provider: paymentMethod,
      providerPaymentId: paymentIntent.id,
      providerData: paymentIntent,
      planId: plan._id,
      customer: {
        email: customerInfo.email,
        name: customerInfo.name,
        ipAddress: req.ip
      }
    });
    
    await payment.save();
    
    // Return payment initialization data to client
    res.status(200).json({
      success: true,
      message: 'Payment initialized',
      data: {
        paymentId: payment._id,
        provider: paymentMethod,
        amount: plan.price,
        currency: plan.currency,
        formattedPrice: plan.formattedPrice,
        clientData: paymentIntent.clientData
      }
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/payments/confirm
 * @desc    Confirm a payment (client-side confirmation)
 * @access  Public
 */
exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentId, providerPaymentId, mac } = req.body;
    
    // Find payment in database
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Get provider-specific payment ID if not provided
    const paymentIntentId = providerPaymentId || payment.providerPaymentId;
    
    // Create payment provider instance
    const provider = createPaymentProvider(
      payment.provider,
      config.payments.providers[payment.provider]
    );
    
    // Check payment status
    const paymentStatus = await provider.getPaymentStatus(paymentIntentId);
    
    // Update payment record
    await payment.updateStatus(paymentStatus.status, paymentStatus);
    
    // If payment is successful, authorize guest access
    if (paymentStatus.status === 'succeeded') {
      // Find associated plan
      const plan = await Plan.findById(payment.planId);
      if (!plan) {
        return res.status(200).json({
          success: true,
          message: 'Payment confirmed but plan not found',
          data: {
            paymentId: payment._id,
            status: payment.status
          }
        });
      }
      
      // Create or update guest
      const normalizedMac = mac?.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
      let guest = null;
      
      if (normalizedMac) {
        // Format MAC address with colons
        const formattedMac = normalizedMac.match(/.{1,2}/g).join(':');
        
        // Look for existing guest
        guest = await Guest.findOne({ mac: formattedMac });
        
        if (!guest) {
          // Create new guest
          guest = new Guest({
            mac: formattedMac,
            ip: req.ip,
            email: payment.customer?.email,
            accessType: 'payment',
            paymentId: payment._id,
            planId: payment.planId
          });
        } else {
          // Update existing guest
          guest.accessType = 'payment';
          guest.paymentId = payment._id;
          guest.planId = payment.planId;
          guest.ip = req.ip;
          if (payment.customer?.email) {
            guest.email = payment.customer.email;
          }
        }
        
        // Calculate expiration time
        const durationInSeconds = plan.getDurationInSeconds();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationInSeconds * 1000);
        
        // Update guest authorization details
        guest.authorized = true;
        guest.authorizedAt = now;
        guest.expiresAt = expiresAt;
        guest.status = 'authorized';
        
        await guest.save();
        
        // Update payment with guest ID
        payment.guestId = guest._id;
        await payment.save();
        
        // Try to authorize with UniFi Controller
        try {
          await unifiService.authorizeGuest({
            mac: formattedMac,
            minutesDuration: Math.floor(durationInSeconds / 60),
            uploadBandwidth: plan.bandwidth.upload,
            downloadBandwidth: plan.bandwidth.download,
            name: payment.customer?.name || 'Guest'
          });
        } catch (unifiError) {
          console.error('UniFi authorization error:', unifiError);
          // Continue anyway - we'll handle this manually if needed
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Payment confirmed and access granted',
        data: {
          paymentId: payment._id,
          status: payment.status,
          guestId: guest?._id,
          expiresAt: guest?.expiresAt
        }
      });
    }
    
    // Payment not successful yet
    res.status(200).json({
      success: true,
      message: 'Payment status updated',
      data: {
        paymentId: payment._id,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment details
 * @access  Admin
 */
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('planId', 'name price currency duration')
      .populate('guestId', 'mac email name status');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments
 * @desc    Get all payments with filtering and pagination
 * @access  Admin
 */
exports.getAllPayments = async (req, res, next) => {
  try {
    const { status, provider, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    // Add filters if provided
    if (status) query.status = status;
    if (provider) query.provider = provider;
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Payment.countDocuments(query);
    
    // Get paginated results
    const payments = await Payment.find(query)
      .populate('planId', 'name price currency duration')
      .populate('guestId', 'mac email name status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Process refund for a payment
 * @access  Admin
 */
exports.refundPayment = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    
    // Find payment
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Ensure payment is in a refundable state
    if (payment.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Cannot refund payment with status: ${payment.status}`
      });
    }
    
    // Create payment provider instance
    const provider = createPaymentProvider(
      payment.provider,
      config.payments.providers[payment.provider]
    );
    
    // Process refund
    const refundResult = await provider.refundPayment(
      payment.providerPaymentId,
      amount || payment.amount,
      reason
    );
    
    // Update payment status
    const refundStatus = amount && amount < payment.amount ? 'partially_refunded' : 'refunded';
    await payment.updateStatus(refundStatus, {
      refund: {
        amount: refundResult.amount,
        reason,
        date: new Date()
      },
      refundResult
    });
    
    // If payment is associated with a guest, revoke access
    if (payment.guestId && refundStatus === 'refunded') {
      const guest = await Guest.findById(payment.guestId);
      
      if (guest && guest.accessType === 'payment' && guest.paymentId.equals(payment._id)) {
        guest.authorized = false;
        guest.status = 'disconnected';
        guest.disconnectedAt = new Date();
        await guest.save();
        
        // Try to unauthorize with UniFi Controller
        try {
          await unifiService.unauthorizeGuest(guest.mac);
        } catch (unifiError) {
          console.error('UniFi unauthorization error:', unifiError);
          // Continue anyway - we'll handle this manually if needed
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Payment ${refundStatus}`,
      data: {
        paymentId: payment._id,
        refundAmount: refundResult.amount,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Payment refund error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/payments/webhook/:provider
 * @desc    Handle webhook events from payment providers
 * @access  Public
 */
exports.handleWebhook = async (req, res, next) => {
  try {
    const { provider } = req.params;
    
    // Validate provider
    if (!config.payments.providers[provider]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported payment provider: ${provider}`
      });
    }
    
    // Get webhook signature
    const signature = req.headers[`x-${provider}-signature`] || 
                      req.headers['stripe-signature'] ||
                      req.headers['paypal-signature'] ||
                      '';
    
    // Get raw body
    const payload = req.body;
    
    // Process based on provider
    let result;
    
    switch (provider) {
      case 'stripe':
        // Import here to avoid circular dependencies
        const { processStripeWebhook } = require('../services/payments/webhooks/stripeWebhooks');
        
        // Create provider instance
        const stripeProvider = createPaymentProvider(
          'stripe',
          config.payments.providers.stripe
        );
        
        // Verify and construct the event
        const event = await stripeProvider.handleWebhook(
          req.rawBody, // express-raw-body middleware should provide this
          signature
        );
        
        // Process the event
        result = await processStripeWebhook(event);
        break;
        
      // Add cases for other providers when implemented
      // case 'paypal':
      //   const { processPayPalWebhook } = require('../services/payments/webhooks/paypalWebhooks');
      //   result = await processPayPalWebhook(payload, signature);
      //   break;
        
      default:
        return res.status(400).json({
          success: false,
          message: `Webhook handler not implemented for provider: ${provider}`
        });
    }
    
    // Return result
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // For webhooks, always return 200 to acknowledge receipt
    // even if processing failed (to prevent repeated delivery)
    res.status(200).json({
      success: false,
      message: 'Webhook received but processing failed',
      error: error.message
    });
  }
};
