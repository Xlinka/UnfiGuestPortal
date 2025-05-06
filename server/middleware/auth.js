/**
 * Authentication middleware
 * Verifies JWT tokens and provides role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

/**
 * Middleware to protect routes requiring authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from Bearer token
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check if token exists in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }
    
    // If no token found, return unauthorized error
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Find user from decoded token
      const user = await User.findById(decoded.id);
      
      // If user not found, return unauthorized error
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // If user is not active, return unauthorized error
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }
      
      // Add user to request object
      req.user = user;
      
      // Continue to next middleware
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or token expired'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param {...String} roles - Allowed roles
 * @returns {Function} - Express middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists on request
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'Auth middleware error: User not found on request'
      });
    }
    
    // Check if user's role is included in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    // User is authorized, continue to next middleware
    next();
  };
};

/**
 * Utility middleware to update last login time
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateLastLogin = async (req, res, next) => {
  try {
    // Update lastLogin field for the user
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(req.user._id, {
        lastLogin: new Date()
      });
    }
    next();
  } catch (error) {
    // Don't fail the request if updating lastLogin fails
    console.error('Failed to update last login time:', error);
    next();
  }
};
