const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Setting key is required'],
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Setting value is required']
  },
  group: {
    type: String,
    required: [true, 'Setting group is required'],
    trim: true
  },
  label: {
    type: String,
    required: [true, 'Setting label is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json', 'array'],
    default: 'string'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  options: {
    type: [mongoose.Schema.Types.Mixed]
  },
  // Schema validation
  validation: {
    min: {
      type: Number
    },
    max: {
      type: Number
    },
    pattern: {
      type: String
    },
    enum: {
      type: [String]
    }
  },
  // Metadata
  updatedBy: {
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

// Pre-save hook to validate value format based on type
SettingSchema.pre('save', function(next) {
  try {
    // Validate value based on type
    switch (this.type) {
      case 'string':
        if (typeof this.value !== 'string') {
          throw new Error(`Setting "${this.key}" expects a string value`);
        }
        
        // Check pattern validation if provided
        if (this.validation?.pattern && !new RegExp(this.validation.pattern).test(this.value)) {
          throw new Error(`Setting "${this.key}" value does not match the required pattern`);
        }
        
        // Check enum validation if provided
        if (this.validation?.enum?.length && !this.validation.enum.includes(this.value)) {
          throw new Error(`Setting "${this.key}" value must be one of: ${this.validation.enum.join(', ')}`);
        }
        
        // Check min/max length if provided
        if (this.validation?.min !== undefined && this.value.length < this.validation.min) {
          throw new Error(`Setting "${this.key}" value must be at least ${this.validation.min} characters`);
        }
        
        if (this.validation?.max !== undefined && this.value.length > this.validation.max) {
          throw new Error(`Setting "${this.key}" value cannot exceed ${this.validation.max} characters`);
        }
        break;
        
      case 'number':
        if (typeof this.value !== 'number' || isNaN(this.value)) {
          throw new Error(`Setting "${this.key}" expects a numeric value`);
        }
        
        // Check min/max if provided
        if (this.validation?.min !== undefined && this.value < this.validation.min) {
          throw new Error(`Setting "${this.key}" value must be at least ${this.validation.min}`);
        }
        
        if (this.validation?.max !== undefined && this.value > this.validation.max) {
          throw new Error(`Setting "${this.key}" value cannot exceed ${this.validation.max}`);
        }
        break;
        
      case 'boolean':
        if (typeof this.value !== 'boolean') {
          throw new Error(`Setting "${this.key}" expects a boolean value`);
        }
        break;
        
      case 'json':
        if (typeof this.value === 'string') {
          try {
            // If string, try to parse as JSON
            this.value = JSON.parse(this.value);
          } catch (error) {
            throw new Error(`Setting "${this.key}" contains invalid JSON`);
          }
        } else if (typeof this.value !== 'object') {
          throw new Error(`Setting "${this.key}" expects a JSON object value`);
        }
        break;
        
      case 'array':
        if (!Array.isArray(this.value)) {
          if (typeof this.value === 'string') {
            // Try to parse string as JSON array
            try {
              const parsedValue = JSON.parse(this.value);
              if (!Array.isArray(parsedValue)) {
                throw new Error(`Setting "${this.key}" expects an array value`);
              }
              this.value = parsedValue;
            } catch (error) {
              // Try comma-separated string
              this.value = this.value.split(',').map(item => item.trim());
            }
          } else {
            throw new Error(`Setting "${this.key}" expects an array value`);
          }
        }
        
        // Check min/max length if provided
        if (this.validation?.min !== undefined && this.value.length < this.validation.min) {
          throw new Error(`Setting "${this.key}" array must contain at least ${this.validation.min} items`);
        }
        
        if (this.validation?.max !== undefined && this.value.length > this.validation.max) {
          throw new Error(`Setting "${this.key}" array cannot contain more than ${this.validation.max} items`);
        }
        break;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get a setting value by key
SettingSchema.statics.getValueByKey = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Static method to set a setting value by key
SettingSchema.statics.setValueByKey = async function(key, value, userId) {
  const setting = await this.findOne({ key });
  
  if (!setting) {
    throw new Error(`Setting "${key}" not found`);
  }
  
  setting.value = value;
  setting.updatedBy = userId;
  
  return setting.save();
};

// Static method to get all settings in a group
SettingSchema.statics.getSettingsByGroup = async function(group, publicOnly = false) {
  const query = { group };
  
  if (publicOnly) {
    query.isPublic = true;
  }
  
  return this.find(query).sort('key');
};

// Static method to get all publicly visible settings
SettingSchema.statics.getPublicSettings = async function() {
  return this.find({ isPublic: true }).sort('group key');
};

// Indexes for efficient queries
SettingSchema.index({ key: 1 });
SettingSchema.index({ group: 1 });
SettingSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Setting', SettingSchema);
