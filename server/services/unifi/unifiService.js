/**
 * UniFi Controller API Service
 * Handles communication with the UniFi Controller API for guest authorization
 */

const axios = require('axios');
const https = require('https');
const config = require('../../config/config');

class UnifiService {
  constructor() {
    this.baseURL = config.unifi.controller.url;
    this.port = config.unifi.controller.port;
    this.username = config.unifi.controller.username;
    this.password = config.unifi.controller.password;
    this.site = config.unifi.controller.site;
    this.cookie = null;
    this.loggedIn = false;
    
    // Create axios instance with proper configuration
    this.api = axios.create({
      baseURL: `${this.baseURL}:${this.port}`,
      // Skip SSL certificate validation if configured
      httpsAgent: new https.Agent({ 
        rejectUnauthorized: config.unifi.controller.verifyCertificate 
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Add response interceptor to manage cookies
    this.api.interceptors.response.use(
      response => {
        // Capture cookies from response
        const cookies = response.headers['set-cookie'];
        if (cookies) {
          this.cookie = cookies.join('; ');
          this.api.defaults.headers.Cookie = this.cookie;
        }
        return response;
      },
      error => {
        // Handle session expiration
        if (error.response && error.response.status === 401) {
          this.loggedIn = false;
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Log in to the UniFi Controller
   * @returns {Promise<boolean>} - Success indicator
   */
  async login() {
    try {
      // Skip login if already logged in
      if (this.loggedIn) {
        return true;
      }
      
      // Determine login endpoint based on controller version
      // UniFi OS uses /api/auth/login, older versions use /api/login
      const loginEndpoint = '/api/auth/login';
      
      const response = await this.api.post(loginEndpoint, {
        username: this.username,
        password: this.password
      });
      
      if (response.status === 200) {
        this.loggedIn = true;
        console.log('Successfully logged in to UniFi Controller');
        return true;
      } else {
        throw new Error(`Login failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('UniFi login error:', error.message);
      
      // Try alternate login endpoint if first one fails
      if (error.response && error.response.status === 404) {
        try {
          const alternateLoginEndpoint = '/api/login';
          const response = await this.api.post(alternateLoginEndpoint, {
            username: this.username,
            password: this.password
          });
          
          if (response.status === 200) {
            this.loggedIn = true;
            console.log('Successfully logged in to UniFi Controller (using alternate endpoint)');
            return true;
          }
        } catch (altError) {
          console.error('UniFi alternate login error:', altError.message);
        }
      }
      
      this.loggedIn = false;
      throw new Error(`Failed to log in to UniFi Controller: ${error.message}`);
    }
  }
  
  /**
   * Ensure we're logged in before making API calls
   */
  async ensureLoggedIn() {
    if (!this.loggedIn) {
      await this.login();
    }
  }
  
  /**
   * Authorize a guest on the network
   * @param {Object} options - Authorization options
   * @returns {Promise<Object>} - Authorization result
   */
  async authorizeGuest(options) {
    try {
      await this.ensureLoggedIn();
      
      const {
        mac,
        minutesDuration = 60,
        uploadBandwidth = null,
        downloadBandwidth = null,
        quotaMegabytes = null,
        name = '',
        authorizeOnly = false
      } = options;
      
      if (!mac) {
        throw new Error('MAC address is required');
      }
      
      // Normalize MAC address format
      const normalizedMac = this.normalizeMac(mac);
      
      // Build authorize request
      const authRequest = {
        cmd: 'authorize-guest',
        mac: normalizedMac,
        minutes: minutesDuration
      };
      
      // Add optional parameters if provided
      if (uploadBandwidth) authRequest.up = uploadBandwidth;
      if (downloadBandwidth) authRequest.down = downloadBandwidth;
      if (quotaMegabytes) authRequest.bytes = quotaMegabytes * 1024 * 1024;
      if (name) authRequest.name = name;
      
      // API endpoint
      const endpoint = `/api/s/${this.site}/cmd/stamgr`;
      
      // Make the request
      const response = await this.api.post(endpoint, authRequest);
      
      if (response.data.meta.rc === 'ok') {
        console.log(`Successfully authorized guest: ${normalizedMac}`);
        
        // If authorizeOnly is false, also add the guest to the authorized guests list
        if (!authorizeOnly) {
          await this.createGuestUser({
            mac: normalizedMac,
            name: name || 'Guest',
            expirationMinutes: minutesDuration
          });
        }
        
        return {
          success: true,
          mac: normalizedMac,
          message: 'Guest authorized successfully'
        };
      } else {
        throw new Error(`Authorization failed: ${response.data.meta.msg}`);
      }
    } catch (error) {
      console.error('UniFi authorizeGuest error:', error.message);
      throw new Error(`Failed to authorize guest: ${error.message}`);
    }
  }
  
  /**
   * Unauthorize/disconnect a guest
   * @param {String} mac - Guest MAC address
   * @returns {Promise<Object>} - Unauthorization result
   */
  async unauthorizeGuest(mac) {
    try {
      await this.ensureLoggedIn();
      
      if (!mac) {
        throw new Error('MAC address is required');
      }
      
      // Normalize MAC address format
      const normalizedMac = this.normalizeMac(mac);
      
      // Build unauthorize request
      const unauthorizeRequest = {
        cmd: 'unauthorize-guest',
        mac: normalizedMac
      };
      
      // API endpoint
      const endpoint = `/api/s/${this.site}/cmd/stamgr`;
      
      // Make the request
      const response = await this.api.post(endpoint, unauthorizeRequest);
      
      if (response.data.meta.rc === 'ok') {
        console.log(`Successfully unauthorized guest: ${normalizedMac}`);
        return {
          success: true,
          mac: normalizedMac,
          message: 'Guest unauthorized successfully'
        };
      } else {
        throw new Error(`Unauthorization failed: ${response.data.meta.msg}`);
      }
    } catch (error) {
      console.error('UniFi unauthorizeGuest error:', error.message);
      throw new Error(`Failed to unauthorize guest: ${error.message}`);
    }
  }
  
  /**
   * Create a guest user in the UniFi system
   * @param {Object} options - Guest user options
   * @returns {Promise<Object>} - Creation result
   */
  async createGuestUser(options) {
    try {
      await this.ensureLoggedIn();
      
      const {
        mac,
        name,
        email = '',
        expirationMinutes = 1440, // Default 24 hours
        uploadBandwidth = null,
        downloadBandwidth = null,
        quotaMegabytes = null
      } = options;
      
      if (!mac) {
        throw new Error('MAC address is required');
      }
      
      // Normalize MAC address format
      const normalizedMac = this.normalizeMac(mac);
      
      // Calculate expiration timestamp (seconds since epoch)
      const expirationTime = Math.floor(Date.now() / 1000) + (expirationMinutes * 60);
      
      // Build guest user object
      const guestUser = {
        name,
        mac: normalizedMac,
        email,
        note: 'Created by UniFi Guest Portal',
        end: expirationTime
      };
      
      // Add optional bandwidth limits if provided
      if (uploadBandwidth) guestUser.upload_bandwidth = uploadBandwidth;
      if (downloadBandwidth) guestUser.download_bandwidth = downloadBandwidth;
      if (quotaMegabytes) guestUser.quota = quotaMegabytes;
      
      // API endpoint
      const endpoint = `/api/s/${this.site}/rest/user`;
      
      // Make the request
      const response = await this.api.post(endpoint, guestUser);
      
      if (response.data.meta.rc === 'ok') {
        console.log(`Successfully created guest user: ${normalizedMac}`);
        return {
          success: true,
          mac: normalizedMac,
          userId: response.data.data[0]?._id,
          message: 'Guest user created successfully'
        };
      } else {
        throw new Error(`Guest user creation failed: ${response.data.meta.msg}`);
      }
    } catch (error) {
      console.error('UniFi createGuestUser error:', error.message);
      throw new Error(`Failed to create guest user: ${error.message}`);
    }
  }
  
  /**
   * Get client device information
   * @param {String} mac - Client MAC address
   * @returns {Promise<Object>} - Client information
   */
  async getClientInfo(mac) {
    try {
      await this.ensureLoggedIn();
      
      if (!mac) {
        throw new Error('MAC address is required');
      }
      
      // Normalize MAC address format
      const normalizedMac = this.normalizeMac(mac);
      
      // API endpoint
      const endpoint = `/api/s/${this.site}/stat/sta/${normalizedMac}`;
      
      // Make the request
      const response = await this.api.get(endpoint);
      
      if (response.data.meta.rc === 'ok') {
        if (response.data.data && response.data.data.length > 0) {
          const clientData = response.data.data[0];
          return {
            success: true,
            mac: normalizedMac,
            isAuthorized: clientData.authorized || false,
            ipAddress: clientData.ip,
            hostname: clientData.hostname || '',
            lastSeen: clientData.last_seen,
            rxBytes: clientData.rx_bytes,
            txBytes: clientData.tx_bytes,
            rxRate: clientData.rx_rate,
            txRate: clientData.tx_rate,
            signalStrength: clientData.signal,
            uptime: clientData.uptime,
            fullData: clientData
          };
        } else {
          return {
            success: false,
            mac: normalizedMac,
            message: 'Client not found'
          };
        }
      } else {
        throw new Error(`Failed to get client info: ${response.data.meta.msg}`);
      }
    } catch (error) {
      console.error('UniFi getClientInfo error:', error.message);
      throw new Error(`Failed to get client info: ${error.message}`);
    }
  }
  
  /**
   * Get all client devices
   * @returns {Promise<Array>} - List of client devices
   */
  async getAllClients() {
    try {
      await this.ensureLoggedIn();
      
      // API endpoint
      const endpoint = `/api/s/${this.site}/stat/sta`;
      
      // Make the request
      const response = await this.api.get(endpoint);
      
      if (response.data.meta.rc === 'ok') {
        return {
          success: true,
          clients: response.data.data.map(client => ({
            mac: client.mac,
            ipAddress: client.ip,
            hostname: client.hostname || '',
            lastSeen: client.last_seen,
            isAuthorized: client.authorized || false,
            isGuest: client.is_guest || false,
            rxBytes: client.rx_bytes,
            txBytes: client.tx_bytes
          }))
        };
      } else {
        throw new Error(`Failed to get clients: ${response.data.meta.msg}`);
      }
    } catch (error) {
      console.error('UniFi getAllClients error:', error.message);
      throw new Error(`Failed to get clients: ${error.message}`);
    }
  }
  
  /**
   * Normalize MAC address to UniFi's preferred format
   * @param {String} mac - MAC address in any format
   * @returns {String} - Normalized MAC address
   */
  normalizeMac(mac) {
    // Remove all non-hex characters and convert to lowercase
    const cleanMac = mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
    
    // Check if it's a valid MAC address
    if (cleanMac.length !== 12) {
      throw new Error('Invalid MAC address');
    }
    
    // Return the MAC in UniFi's preferred format (lowercase with colons)
    return cleanMac.match(/.{1,2}/g).join(':');
  }
}

// Create a singleton instance
const unifiService = new UnifiService();

module.exports = unifiService;
