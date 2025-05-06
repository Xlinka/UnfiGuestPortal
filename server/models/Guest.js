const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  // Basic guest information
  mac: {
    type: String,
    required: [true, 'MAC address is required'],
    unique: true,
    trim: true,
    match: [
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      'Please provide a valid MAC address'
    ]
  },
  ip: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Connection information
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'laptop', 'desktop', 'other'],
    default: 'other'
  },
  browser: {
    type: String,
    trim: true
  },
  os: {
    type: String,
    trim: true
  },
  
  // Access information
  accessType: {
    type: String,
    enum: ['voucher', 'payment', 'free', 'admin'],
    required: [true, 'Access type is required']
  },
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
  
  // Status information
  isConnected: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'authorized', 'connected', 'disconnected', 'blocked'],
    default: 'pending'
  },
  
  // Time constraints
  authorized: {
    type: Boolean,
    default: false
  },
  authorizedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  disconnectedAt: {
    type: Date
  },
  
  // Bandwidth usage
  dataUsage: {
    download: {
      type: Number,
      default: 0
    },
    upload: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Unifi specific information
  unifiData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
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

// Method to check if guest access is expired
GuestSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to calculate remaining time
GuestSchema.methods.getRemainingTime = function() {
  if (!this.expiresAt) return 0;
  if (this.isExpired()) return 0;
  
  return Math.max(0, Math.floor((this.expiresAt - new Date()) / 1000));
};

// Method to update data usage
GuestSchema.methods.updateDataUsage = function(downloadBytes, uploadBytes) {
  this.dataUsage.download += downloadBytes || 0;
  this.dataUsage.upload += uploadBytes || 0;
  this.dataUsage.total = this.dataUsage.download + this.dataUsage.upload;
  return this.save();
};

// Virtual for formatted expiration date
GuestSchema.virtual('formattedExpiration').get(function() {
  if (!this.expiresAt) return 'Never';
  return this.expiresAt.toLocaleString();
});

// Index for efficient queries
GuestSchema.index({ mac: 1 });
GuestSchema.index({ status: 1 });
GuestSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Guest', GuestSchema);
