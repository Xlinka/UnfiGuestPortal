const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  // Amount and currency
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    trim: true,
    lowercase: true,
    maxlength: [3, 'Currency code cannot exceed 3 characters']
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['initialized', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
    default: 'initialized'
  },
  
  // Payment provider information
  provider: {
    type: String,
    required: [true, 'Payment provider is required'],
    trim: true
  },
  providerPaymentId: {
    type: String,
    trim: true
  },
  // Store any provider-specific data as JSON
  providerData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // If this payment is a refund, store the original payment ID
  originalPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  
  // Refund information
  refund: {
    amount: {
      type: Number
    },
    reason: {
      type: String,
      trim: true
    },
    date: {
      type: Date
    }
  },
  
  // Relations
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest'
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: [true, 'Plan ID is required']
  },
  
  // Customer information
  customer: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    }
  },
  
  // Transaction metadata
  description: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt' 
  }
});

// Method to update payment status
PaymentSchema.methods.updateStatus = function(status, providerData = {}) {
  this.status = status;
  
  // Merge new provider data with existing data
  this.providerData = { ...this.providerData, ...providerData };
  
  // Set processed timestamp for final statuses
  if (['succeeded', 'failed', 'refunded', 'partially_refunded'].includes(status)) {
    this.processedAt = new Date();
  }
  
  return this.save();
};

// Method to process refund
PaymentSchema.methods.processRefund = async function(amount, reason = '') {
  // Ensure the payment was successful
  if (this.status !== 'succeeded') {
    throw new Error(`Cannot refund payment with status: ${this.status}`);
  }
  
  // Calculate refund amount
  const refundAmount = amount || this.amount;
  
  // Validate refund amount
  if (refundAmount <= 0) {
    throw new Error('Refund amount must be greater than zero');
  }
  
  if (refundAmount > this.amount) {
    throw new Error('Refund amount cannot exceed the original payment amount');
  }
  
  // Update payment status based on refund amount
  this.status = refundAmount === this.amount ? 'refunded' : 'partially_refunded';
  
  // Record refund details
  this.refund = {
    amount: refundAmount,
    reason,
    date: new Date()
  };
  
  return this.save();
};

// Virtual for formatted amount
PaymentSchema.virtual('formattedAmount').get(function() {
  const currencySymbols = {
    usd: '$',
    eur: '€',
    gbp: '£',
    // Add more currencies as needed
  };
  
  const symbol = currencySymbols[this.currency.toLowerCase()] || this.currency.toUpperCase() + ' ';
  return `${symbol}${this.amount.toFixed(2)}`;
});

// Virtual for formatted date
PaymentSchema.virtual('formattedDate').get(function() {
  const date = this.processedAt || this.createdAt;
  return date.toLocaleString();
});

// Indexes for efficient queries
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ provider: 1, providerPaymentId: 1 });
PaymentSchema.index({ guestId: 1 });
PaymentSchema.index({ planId: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
