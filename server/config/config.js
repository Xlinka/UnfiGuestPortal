// Main configuration file for the application

// Load environment variables
require('dotenv').config();

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/unifi-guest-portal',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // JWT authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-for-development-only',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  
  // UniFi controller settings
  unifi: {
    controller: {
      url: process.env.UNIFI_CONTROLLER_URL || 'https://unifi.example.com',
      port: process.env.UNIFI_CONTROLLER_PORT || 8443,
      username: process.env.UNIFI_USERNAME,
      password: process.env.UNIFI_PASSWORD,
      site: process.env.UNIFI_SITE || 'default',
      verifyCertificate: process.env.UNIFI_VERIFY_CERTIFICATE === 'true'
    }
  },
  
  // Payment providers configuration
  payments: require('./payments')
};
