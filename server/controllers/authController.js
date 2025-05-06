/**
 * Authentication Controller
 * Handles user authentication, registration, and account management
 */

const User = require('../models/User');
const Setting = require('../models/Setting');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new admin user
 * @access  Admin
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Determine the role (only superadmin can create other superadmins)
    let userRole = role || 'admin';
    
    // If the requester is not superadmin and tries to create a superadmin, override to admin
    if (req.user && req.user.role !== 'superadmin' && userRole === 'superadmin') {
      userRole = 'admin';
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: userRole
    });
    
    // Remove password from response
    user.password = undefined;
    
    // Send response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }
    
    // Find user and include password for comparison
    const user = await User.findOne({ username }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = user.generateAuthToken();
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Remove password from response
    user.password = undefined;
    
    // Get session duration from settings or use default
    const sessionDuration = await Setting.getValueByKey('auth_session_duration', 24);
    
    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: sessionDuration * 60 * 60 * 1000, // Convert hours to milliseconds
      sameSite: 'lax'
    });
    
    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear cookie
 * @access  Private
 */
exports.logout = (req, res, next) => {
  try {
    // Clear token cookie
    res.clearCookie('token');
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/updateprofile
 * @desc    Update user profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, email },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/changepassword
 * @desc    Change user password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/initadmin
 * @desc    Initialize the first superadmin user (only works if no users exist)
 * @access  Public (but only works once)
 */
exports.initializeAdmin = async (req, res, next) => {
  try {
    // Check if any users exist
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin users already exist'
      });
    }
    
    const { username, email, password } = req.body;
    
    // Create superadmin user
    const admin = await User.create({
      username,
      email,
      password,
      role: 'superadmin',
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true
    });
    
    // Remove password from response
    admin.password = undefined;
    
    res.status(201).json({
      success: true,
      message: 'Superadmin user created successfully',
      data: admin
    });
  } catch (error) {
    next(error);
  }
};
