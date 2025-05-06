/**
 * Sample Data Controller
 * Handles initialization of sample data from the admin dashboard
 */

const User = require('../models/User');
const Plan = require('../models/Plan');
const Setting = require('../models/Setting');

// Sample data
const samplePlans = [
  {
    name: 'Hourly Pass',
    description: 'Quick access for 1 hour',
    price: 2.99,
    currency: 'usd',
    duration: {
      value: 1,
      unit: 'hours'
    },
    bandwidth: {
      download: 5,
      upload: 2,
      unit: 'mbps'
    },
    dataLimit: {
      unlimited: true
    },
    features: ['Basic web browsing', 'Email access'],
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Day Pass',
    description: 'Full day access for 24 hours',
    price: 5.99,
    currency: 'usd',
    duration: {
      value: 24,
      unit: 'hours'
    },
    bandwidth: {
      download: 10,
      upload: 5,
      unit: 'mbps'
    },
    dataLimit: {
      unlimited: true
    },
    features: ['HD video streaming', 'Video calls', 'Fast downloads'],
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Week Pass',
    description: 'Stay connected for a full week',
    price: 15.99,
    currency: 'usd',
    duration: {
      value: 7,
      unit: 'days'
    },
    bandwidth: {
      download: 20,
      upload: 10,
      unit: 'mbps'
    },
    dataLimit: {
      value: 100,
      unit: 'gb',
      unlimited: false
    },
    features: ['HD video streaming', 'Video calls', 'Fast downloads', 'Priority support'],
    isActive: true,
    sortOrder: 3
  }
];

const defaultSettings = [
  {
    key: 'network_name',
    value: 'UniFi Guest WiFi',
    group: 'network',
    label: 'Network Name',
    description: 'Name displayed on the guest portal',
    type: 'string',
    isPublic: true
  },
  {
    key: 'network_provider',
    value: 'Your Company Name',
    group: 'network',
    label: 'Network Provider',
    description: 'Name of the network provider',
    type: 'string',
    isPublic: true
  },
  {
    key: 'terms_and_conditions',
    value: 'By using this WiFi network, you agree to our terms and conditions.',
    group: 'legal',
    label: 'Terms and Conditions',
    description: 'Legal terms for network usage',
    type: 'string',
    isPublic: true
  },
  {
    key: 'auth_session_duration',
    value: 24,
    group: 'auth',
    label: 'Session Duration (hours)',
    description: 'How long admin sessions remain valid',
    type: 'number',
    isPublic: false
  },
  {
    key: 'portal_logo_url',
    value: '/logo.svg',
    group: 'appearance',
    label: 'Portal Logo URL',
    description: 'URL to the logo image',
    type: 'string',
    isPublic: true
  },
  {
    key: 'default_voucher_duration',
    value: 24,
    group: 'vouchers',
    label: 'Default Voucher Duration (hours)',
    description: 'Default duration for new vouchers',
    type: 'number',
    isPublic: false
  }
];

/**
 * @route   POST /api/admin/sample-data
 * @desc    Initialize sample data for the application
 * @access  Admin
 */
exports.initializeSampleData = async (req, res, next) => {
  try {
    const results = {
      plans: { created: 0, existing: 0 },
      settings: { created: 0, existing: 0 }
    };
    
    // Check if plans already exist
    const plansCount = await Plan.countDocuments();
    
    if (plansCount === 0) {
      // Create plans
      await Plan.insertMany(samplePlans);
      results.plans.created = samplePlans.length;
    } else {
      results.plans.existing = plansCount;
    }
    
    // Check if settings already exist
    const settingsCount = await Setting.countDocuments();
    
    if (settingsCount === 0) {
      // Create settings
      await Setting.insertMany(defaultSettings);
      results.settings.created = defaultSettings.length;
    } else {
      results.settings.existing = settingsCount;
    }
    
    // Return results
    res.status(200).json({
      success: true,
      message: 'Sample data initialization complete',
      data: results
    });
  } catch (error) {
    console.error('Error initializing sample data:', error);
    next(error);
  }
};
