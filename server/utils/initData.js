/**
 * Initialize database with sample data
 * Run with: node server/utils/initData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config/config');

// Import models
const User = require('../models/User');
const Plan = require('../models/Plan');
const Setting = require('../models/Setting');

// Connect to MongoDB
mongoose.connect(config.database.uri, config.database.options)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

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

// Create admin user function
async function createAdminUser() {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists, skipping creation');
      return;
    }
    
    // Generate hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('adminpassword', salt);
    
    // Create superadmin user
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'superadmin',
      isActive: true
    });
    
    await admin.save();
    console.log('Admin user created:');
    console.log('Username: admin');
    console.log('Password: adminpassword');
    console.log('NOTE: Please change this password immediately after first login!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Create plans function
async function createPlans() {
  try {
    // Check if plans already exist
    const plansCount = await Plan.countDocuments();
    
    if (plansCount > 0) {
      console.log(`${plansCount} plans already exist, skipping creation`);
      return;
    }
    
    // Create plans
    await Plan.insertMany(samplePlans);
    console.log(`${samplePlans.length} plans created`);
  } catch (error) {
    console.error('Error creating plans:', error);
  }
}

// Create settings function
async function createSettings() {
  try {
    // Check if settings already exist
    const settingsCount = await Setting.countDocuments();
    
    if (settingsCount > 0) {
      console.log(`${settingsCount} settings already exist, skipping creation`);
      return;
    }
    
    // Create settings
    await Setting.insertMany(defaultSettings);
    console.log(`${defaultSettings.length} settings created`);
  } catch (error) {
    console.error('Error creating settings:', error);
  }
}

// Main function to initialize data
async function initializeData() {
  try {
    console.log('Initializing database with sample data...');
    
    // Create admin user
    await createAdminUser();
    
    // Create plans
    await createPlans();
    
    // Create settings
    await createSettings();
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
initializeData();
