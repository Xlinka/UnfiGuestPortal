/**
 * Setup Controller
 * Handles first-time setup and configuration of the application
 */

const User = require('../models/User');
const Setting = require('../models/Setting');
const Plan = require('../models/Plan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const dbConfig = require('../config/databaseConfig');

/**
 * Check if the system has been set up
 * @route   GET /api/setup/status
 * @access  Public
 */
exports.getSetupStatus = async (req, res, next) => {
  try {
    // Check if any users exist
    const userCount = await User.countDocuments();
    const needsSetup = userCount === 0;
    
    // Check if required settings exist
    const settingsCount = await Setting.countDocuments({
      key: { $in: ['unifi_controller_url', 'portal_name', 'system_initialized'] }
    });
    
    const needsConfiguration = settingsCount < 3;
    
    // Return setup status
    res.status(200).json({
      success: true,
      data: {
        needsSetup,
        needsConfiguration,
        setupStep: needsSetup ? 'admin' : (needsConfiguration ? 'configuration' : 'complete')
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create initial admin user
 * @route   POST /api/setup/admin
 * @access  Public
 */
exports.setupAdmin = async (req, res, next) => {
  try {
    // Check if any users already exist
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'System has already been set up with an admin user'
      });
    }
    
    const { username, email, password, firstName, lastName } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }
    
    // Create admin user
    const admin = new User({
      username,
      email,
      password, // Will be hashed by the pre-save hook
      firstName: firstName || 'Admin',
      lastName: lastName || 'User',
      role: 'superadmin',
      isActive: true
    });
    
    await admin.save();
    
    // Generate token for immediate login
    const token = jwt.sign(
      { id: admin._id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // Remove password from response
    admin.password = undefined;
    
    // Create initial system setting
    await Setting.create({
      key: 'system_initialized',
      value: true,
      group: 'system',
      label: 'System Initialized',
      description: 'Whether the system has been initialized',
      type: 'boolean',
      isPublic: false
    });
    
    // Return success with token
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: admin,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Configure system settings
 * @route   POST /api/setup/configuration
 * @access  Admin
 */
exports.setupConfiguration = async (req, res, next) => {
  try {
    const { 
      portalName, 
      unifiController, 
      paymentProviders,
      defaultSettings
    } = req.body;
    
    const settingsToCreate = [];
    
    // Portal settings
    if (portalName) {
      settingsToCreate.push({
        key: 'portal_name',
        value: portalName,
        group: 'portal',
        label: 'Portal Name',
        description: 'Name of the WiFi portal',
        type: 'string',
        isPublic: true
      });
    }
    
    // UniFi Controller settings
    if (unifiController) {
      const { url, port, username, password, site, verifyCertificate } = unifiController;
      
      if (url) {
        settingsToCreate.push({
          key: 'unifi_controller_url',
          value: url,
          group: 'unifi',
          label: 'UniFi Controller URL',
          description: 'URL of the UniFi Controller',
          type: 'string',
          isPublic: false
        });
      }
      
      if (port) {
        settingsToCreate.push({
          key: 'unifi_controller_port',
          value: port,
          group: 'unifi',
          label: 'UniFi Controller Port',
          description: 'Port of the UniFi Controller',
          type: 'number',
          isPublic: false
        });
      }
      
      if (username) {
        settingsToCreate.push({
          key: 'unifi_controller_username',
          value: username,
          group: 'unifi',
          label: 'UniFi Controller Username',
          description: 'Username for UniFi Controller authentication',
          type: 'string',
          isPublic: false
        });
      }
      
      if (password) {
        settingsToCreate.push({
          key: 'unifi_controller_password',
          value: password,
          group: 'unifi',
          label: 'UniFi Controller Password',
          description: 'Password for UniFi Controller authentication',
          type: 'string',
          isPublic: false
        });
      }
      
      if (site) {
        settingsToCreate.push({
          key: 'unifi_controller_site',
          value: site,
          group: 'unifi',
          label: 'UniFi Controller Site',
          description: 'Site ID for the UniFi Controller',
          type: 'string',
          isPublic: false
        });
      }
      
      if (verifyCertificate !== undefined) {
        settingsToCreate.push({
          key: 'unifi_controller_verify_certificate',
          value: verifyCertificate,
          group: 'unifi',
          label: 'Verify UniFi SSL Certificate',
          description: 'Whether to verify the SSL certificate of the UniFi Controller',
          type: 'boolean',
          isPublic: false
        });
      }
    }
    
    // Payment provider settings
    if (paymentProviders && paymentProviders.stripe) {
      const { secretKey, publishableKey, webhookSecret } = paymentProviders.stripe;
      
      if (secretKey) {
        settingsToCreate.push({
          key: 'payment_stripe_secret_key',
          value: secretKey,
          group: 'payment',
          label: 'Stripe Secret Key',
          description: 'Secret API key for Stripe',
          type: 'string',
          isPublic: false
        });
      }
      
      if (publishableKey) {
        settingsToCreate.push({
          key: 'payment_stripe_publishable_key',
          value: publishableKey,
          group: 'payment',
          label: 'Stripe Publishable Key',
          description: 'Publishable API key for Stripe',
          type: 'string',
          isPublic: false
        });
      }
      
      if (webhookSecret) {
        settingsToCreate.push({
          key: 'payment_stripe_webhook_secret',
          value: webhookSecret,
          group: 'payment',
          label: 'Stripe Webhook Secret',
          description: 'Webhook signing secret for Stripe',
          type: 'string',
          isPublic: false
        });
      }
      
      // Also add Stripe as an active provider
      settingsToCreate.push({
        key: 'payment_active_providers',
        value: ['stripe'],
        group: 'payment',
        label: 'Active Payment Providers',
        description: 'Enabled payment providers',
        type: 'array',
        isPublic: false
      });
      
      settingsToCreate.push({
        key: 'payment_default_provider',
        value: 'stripe',
        group: 'payment',
        label: 'Default Payment Provider',
        description: 'Default payment provider to use',
        type: 'string',
        isPublic: false
      });
    }
    
    // Add default settings if requested
    if (defaultSettings) {
      // Add default sample WiFi plans
      await createSamplePlans();
      
      // Add additional default settings
      settingsToCreate.push(
        {
          key: 'portal_terms_and_conditions',
          value: 'By using this WiFi network, you agree to abide by all applicable laws and regulations.',
          group: 'portal',
          label: 'Terms and Conditions',
          description: 'Terms and conditions for WiFi usage',
          type: 'string',
          isPublic: true
        },
        {
          key: 'portal_privacy_policy',
          value: 'We respect your privacy and will only collect necessary information to provide the service.',
          group: 'portal',
          label: 'Privacy Policy',
          description: 'Privacy policy for WiFi usage',
          type: 'string',
          isPublic: true
        },
        {
          key: 'portal_contact_email',
          value: 'support@example.com',
          group: 'portal',
          label: 'Contact Email',
          description: 'Email address for support inquiries',
          type: 'string',
          isPublic: true
        },
        {
          key: 'system_session_duration',
          value: 24,
          group: 'system',
          label: 'Session Duration (hours)',
          description: 'Duration of admin login sessions',
          type: 'number',
          isPublic: false
        }
      );
    }
    
    // Save all settings
    if (settingsToCreate.length > 0) {
      await Setting.insertMany(settingsToCreate);
      
      // Invalidate config cache
      dbConfig.invalidateCache();
    }
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'System configuration saved successfully',
      data: {
        settingsCount: settingsToCreate.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create sample WiFi plans
 */
async function createSamplePlans() {
  const plansCount = await Plan.countDocuments();
  
  if (plansCount > 0) {
    return; // Plans already exist
  }
  
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
  
  await Plan.insertMany(samplePlans);
}
