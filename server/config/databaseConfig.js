/**
 * Database-based Configuration Manager
 * Loads configuration from the database and falls back to environment variables
 */

const Setting = require('../models/Setting');

// Cache for settings to avoid excessive database queries
let settingsCache = null;
let cacheExpiration = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Refresh the settings cache from the database
 */
const refreshCache = async () => {
  try {
    // Only refresh if cache is expired or doesn't exist
    const now = Date.now();
    if (settingsCache && cacheExpiration && now < cacheExpiration) {
      return settingsCache;
    }
    
    // Get all settings from database
    const settings = await Setting.find();
    
    // Create a structured cache
    const cache = {
      unifi: {
        controller: {}
      },
      payments: {
        providers: {
          stripe: {}
        }
      },
      portal: {},
      system: {}
    };
    
    // Process settings into structured format
    settings.forEach(setting => {
      const { key, value } = setting;
      
      // UniFi settings
      if (key.startsWith('unifi_')) {
        const unifiKey = key.replace('unifi_', '');
        
        if (unifiKey.startsWith('controller_')) {
          const controllerKey = unifiKey.replace('controller_', '');
          cache.unifi.controller[controllerKey] = value;
        } else {
          cache.unifi[unifiKey] = value;
        }
      }
      // Payment settings
      else if (key.startsWith('payment_')) {
        const paymentKey = key.replace('payment_', '');
        
        if (paymentKey.startsWith('stripe_')) {
          const stripeKey = paymentKey.replace('stripe_', '');
          cache.payments.providers.stripe[stripeKey] = value;
        } else {
          cache.payments[paymentKey] = value;
        }
      }
      // Portal settings
      else if (key.startsWith('portal_')) {
        const portalKey = key.replace('portal_', '');
        cache.portal[portalKey] = value;
      }
      // System settings
      else if (key.startsWith('system_')) {
        const systemKey = key.replace('system_', '');
        cache.system[systemKey] = value;
      }
      // Other settings go to root
      else {
        cache[key] = value;
      }
    });
    
    // Update cache and expiration
    settingsCache = cache;
    cacheExpiration = now + CACHE_TTL;
    
    return cache;
  } catch (error) {
    console.error('Error refreshing settings cache:', error);
    return null;
  }
};

/**
 * Get a configuration value from the database or environment variables
 * @param {String} key - The configuration key in dot notation (e.g., "unifi.controller.url")
 * @param {*} defaultValue - Default value if not found in database or environment
 */
const get = async (key, defaultValue = null) => {
  try {
    // Refresh cache if needed
    const cache = await refreshCache();
    
    if (!cache) {
      // If cache refresh failed, fall back to environment variable
      return getFromEnv(key, defaultValue);
    }
    
    // Convert dot notation to object path
    const path = key.split('.');
    
    // Navigate to the value
    let value = cache;
    for (const segment of path) {
      if (value && typeof value === 'object' && segment in value) {
        value = value[segment];
      } else {
        // If we can't find the value in the cache, check environment variables
        return getFromEnv(key, defaultValue);
      }
    }
    
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    console.error(`Error getting config value for ${key}:`, error);
    return getFromEnv(key, defaultValue);
  }
};

/**
 * Force a refresh of the settings cache
 */
const invalidateCache = () => {
  settingsCache = null;
  cacheExpiration = null;
};

/**
 * Get a configuration value from environment variables
 * @param {String} key - The configuration key in dot notation
 * @param {*} defaultValue - Default value if not found
 */
const getFromEnv = (key, defaultValue = null) => {
  // Convert dot notation to environment variable format
  const envKey = key.toUpperCase().replace(/\./g, '_');
  
  // Check if environment variable exists
  if (process.env[envKey] !== undefined) {
    return process.env[envKey];
  }
  
  return defaultValue;
};

module.exports = {
  get,
  invalidateCache,
  refreshCache
};
