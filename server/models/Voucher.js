const mongoose = require('mongoose');
const crypto = require('crypto');

const VoucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Voucher code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: [true, 'Plan ID is required']
  },
  status: {
    type: String,
    enum: ['active', 'redeemed', 'expired', 'revoked'],
    default: 'active'
  },
  redemptionCount: {
    type: Number,
    default: 0
  },
  maxRedemptions: {
    type: Number,
    default: 1
  },
  multipleUse: {
    type: Boolean,
    default: false
  },
  // The guest who redeemed this voucher
  redeemedBy: [{
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest'
    },
    redeemedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Network throttling and access control settings
  bandwidth: {
    download: {
      type: Number
    },
    upload: {
      type: Number
    },
    unit: {
      type: String,
      enum: ['kbps', 'mbps', 'gbps'],
      default: 'mbps'
    }
  },
  dataLimit: {
    value: {
      type: Number
    },
    unit: {
      type: String,
      enum: ['mb', 'gb', 'tb'],
      default: 'gb'
    },
    unlimited: {
      type: Boolean,
      default: false
    }
  },
  // Time constraints
  duration: {
    value: {
      type: Number
    },
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'weeks', 'months'],
      default: 'hours'
    }
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date
  },
  // Metadata
  notes: {
    type: String,
    trim: true
  },
  batchId: {
    type: String,
    trim: true
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt' 
  }
});

// Redeem a voucher
VoucherSchema.methods.redeem = async function(guestId) {
  // Check if voucher is active
  if (this.status !== 'active') {
    throw new Error(`Voucher is ${this.status}`);
  }
  
  // Check if voucher is within valid time range
  const now = new Date();
  if (this.validFrom && now < this.validFrom) {
    throw new Error('Voucher is not yet valid');
  }
  if (this.validUntil && now > this.validUntil) {
    this.status = 'expired';
    await this.save();
    throw new Error('Voucher has expired');
  }
  
  // Check if max redemptions reached for single-use vouchers
  if (!this.multipleUse && this.redemptionCount >= this.maxRedemptions) {
    this.status = 'redeemed';
    await this.save();
    throw new Error('Voucher has already been redeemed');
  }
  
  // Record the redemption
  this.redeemedBy.push({
    guestId,
    redeemedAt: now
  });
  
  this.redemptionCount += 1;
  
  // Update status if max redemptions reached
  if (!this.multipleUse && this.redemptionCount >= this.maxRedemptions) {
    this.status = 'redeemed';
  }
  
  return this.save();
};

// Check if voucher is valid
VoucherSchema.methods.isValid = function() {
  if (this.status !== 'active') return false;
  
  const now = new Date();
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;
  if (!this.multipleUse && this.redemptionCount >= this.maxRedemptions) return false;
  
  return true;
};

// Revoke a voucher
VoucherSchema.methods.revoke = function() {
  this.status = 'revoked';
  return this.save();
};

// Static method to generate a unique voucher code
VoucherSchema.statics.generateCode = function(length = 8) {
  // Define character set: exclude ambiguous characters like 1, I, l, 0, O
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  
  // Use crypto for better randomness
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    // Use modulo to map the byte to a character index
    code += chars[randomBytes[i] % chars.length];
  }
  
  return code;
};

// Static method to generate multiple vouchers
VoucherSchema.statics.generateBatch = async function(options) {
  const {
    count,
    planId,
    batchId = new mongoose.Types.ObjectId().toString(),
    createdById,
    multipleUse = false,
    maxRedemptions = 1,
    validFrom,
    validUntil,
    notes
  } = options;
  
  const vouchers = [];
  
  for (let i = 0; i < count; i++) {
    let code;
    let existingVoucher;
    
    // Keep generating codes until we find a unique one
    do {
      code = this.generateCode();
      existingVoucher = await this.findOne({ code });
    } while (existingVoucher);
    
    vouchers.push({
      code,
      planId,
      batchId,
      createdById,
      multipleUse,
      maxRedemptions,
      validFrom,
      validUntil,
      notes
    });
  }
  
  return this.insertMany(vouchers);
};

// Indexes for efficient queries
VoucherSchema.index({ code: 1 });
VoucherSchema.index({ status: 1 });
VoucherSchema.index({ validUntil: 1 });
VoucherSchema.index({ batchId: 1 });

module.exports = mongoose.model('Voucher', VoucherSchema);
