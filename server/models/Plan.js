const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxlength: [50, 'Plan name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Plan description cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'usd',
    trim: true,
    lowercase: true,
    maxlength: [3, 'Currency code cannot exceed 3 characters']
  },
  duration: {
    value: {
      type: Number,
      required: [true, 'Duration value is required'],
      min: [1, 'Duration must be at least 1']
    },
    unit: {
      type: String,
      required: [true, 'Duration unit is required'],
      enum: ['minutes', 'hours', 'days', 'weeks', 'months'],
      default: 'hours'
    }
  },
  bandwidth: {
    download: {
      type: Number,
      required: [true, 'Download bandwidth is required'],
      min: [0, 'Download bandwidth cannot be negative']
    },
    upload: {
      type: Number,
      required: [true, 'Upload bandwidth is required'],
      min: [0, 'Upload bandwidth cannot be negative']
    },
    unit: {
      type: String,
      enum: ['kbps', 'mbps', 'gbps'],
      default: 'mbps'
    }
  },
  dataLimit: {
    value: {
      type: Number,
      min: [0, 'Data limit cannot be negative']
    },
    unit: {
      type: String,
      enum: ['mb', 'gb', 'tb'],
      default: 'gb'
    },
    // If unlimited is true, the value is ignored
    unlimited: {
      type: Boolean,
      default: false
    }
  },
  features: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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

// Method to get plan duration in seconds
PlanSchema.methods.getDurationInSeconds = function() {
  const { value, unit } = this.duration;
  
  const unitConversions = {
    minutes: 60,
    hours: 3600,
    days: 86400,
    weeks: 604800,
    months: 2592000 // Approximate - 30 days
  };
  
  return value * unitConversions[unit];
};

// Method to get data limit in bytes
PlanSchema.methods.getDataLimitInBytes = function() {
  if (this.dataLimit.unlimited) return Infinity;
  
  const { value, unit } = this.dataLimit;
  
  const unitConversions = {
    mb: 1048576,        // 1 MB = 1,048,576 bytes
    gb: 1073741824,     // 1 GB = 1,073,741,824 bytes
    tb: 1099511627776   // 1 TB = 1,099,511,627,776 bytes
  };
  
  return value * unitConversions[unit];
};

// Virtual for formatted price
PlanSchema.virtual('formattedPrice').get(function() {
  const currencySymbols = {
    usd: '$',
    eur: '€',
    gbp: '£',
    // Add more currencies as needed
  };
  
  const symbol = currencySymbols[this.currency.toLowerCase()] || this.currency.toUpperCase() + ' ';
  return `${symbol}${this.price.toFixed(2)}`;
});

// Virtual for formatted duration
PlanSchema.virtual('formattedDuration').get(function() {
  const { value, unit } = this.duration;
  
  // Handle singular/plural
  const unitStr = value === 1 ? unit.slice(0, -1) : unit;
  
  return `${value} ${unitStr}`;
});

// Virtual for formatted bandwidth
PlanSchema.virtual('formattedBandwidth').get(function() {
  const { download, upload, unit } = this.bandwidth;
  return `${download}/${upload} ${unit}`;
});

// Virtual for formatted data limit
PlanSchema.virtual('formattedDataLimit').get(function() {
  if (this.dataLimit.unlimited) return 'Unlimited';
  
  const { value, unit } = this.dataLimit;
  return `${value} ${unit.toUpperCase()}`;
});

// Index for efficient queries
PlanSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Plan', PlanSchema);
