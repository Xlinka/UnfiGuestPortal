/**
 * Admin Controller
 * Handles admin-only functionality for managing the portal
 */

const User = require('../models/User');
const Guest = require('../models/Guest');
const Voucher = require('../models/Voucher');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const Setting = require('../models/Setting');
const unifiService = require('../services/unifi/unifiService');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Admin
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get current date and 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get current active guests
    const activeGuests = await Guest.countDocuments({
      authorized: true,
      expiresAt: { $gt: now }
    });
    
    // Get total guests
    const totalGuests = await Guest.countDocuments();
    
    // Get voucher stats
    const activeVouchers = await Voucher.countDocuments({ status: 'active' });
    const redeemedVouchers = await Voucher.countDocuments({ status: 'redeemed' });
    const expiredVouchers = await Voucher.countDocuments({ status: 'expired' });
    
    // Get payment stats
    const successfulPayments = await Payment.countDocuments({ status: 'succeeded' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Monthly revenue
    const monthlyRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'succeeded',
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Daily guest statistics for the past 30 days
    const dailyGuestStats = await Guest.aggregate([
      {
        $match: {
          authorizedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$authorizedAt' },
            month: { $month: '$authorizedAt' },
            day: { $dayOfMonth: '$authorizedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Daily payment statistics for the past 30 days
    const dailyPaymentStats = await Payment.aggregate([
      {
        $match: {
          status: 'succeeded',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        guests: {
          active: activeGuests,
          total: totalGuests,
          dailyStats: dailyGuestStats.map(day => ({
            date: `${day._id.year}-${day._id.month}-${day._id.day}`,
            count: day.count
          }))
        },
        vouchers: {
          active: activeVouchers,
          redeemed: redeemedVouchers,
          expired: expiredVouchers,
          total: activeVouchers + redeemedVouchers + expiredVouchers
        },
        payments: {
          count: successfulPayments,
          totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
          monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0,
          dailyStats: dailyPaymentStats.map(day => ({
            date: `${day._id.year}-${day._id.month}-${day._id.day}`,
            amount: day.total,
            count: day.count
          }))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/guests
 * @desc    Get all guests with filtering and pagination
 * @access  Admin
 */
exports.getAllGuests = async (req, res, next) => {
  try {
    const { status, mac, authorized, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    // Add filters if provided
    if (status) query.status = status;
    if (mac) query.mac = new RegExp(mac, 'i');
    if (authorized === 'true') query.authorized = true;
    if (authorized === 'false') query.authorized = false;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Guest.countDocuments(query);
    
    // Get paginated results
    const guests = await Guest.find(query)
      .populate('planId', 'name duration')
      .populate('paymentId', 'amount status')
      .populate('voucherId', 'code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: guests.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: guests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/guests/:id
 * @desc    Get guest details
 * @access  Admin
 */
exports.getGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id)
      .populate('planId')
      .populate('paymentId')
      .populate('voucherId');
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }
    
    // Try to get additional info from UniFi controller
    let unifiInfo = null;
    try {
      unifiInfo = await unifiService.getClientInfo(guest.mac);
    } catch (unifiError) {
      console.error('UniFi client info error:', unifiError);
      // Continue without UniFi info
    }
    
    // Create response object with combined data
    const guestData = {
      ...guest.toObject(),
      unifiData: unifiInfo && unifiInfo.success ? unifiInfo : null,
      isExpired: guest.isExpired(),
      remainingTime: guest.getRemainingTime()
    };
    
    res.status(200).json({
      success: true,
      data: guestData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/guests/:id/authorize
 * @desc    Authorize a guest
 * @access  Admin
 */
exports.authorizeGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }
    
    const { durationHours = 24 } = req.body;
    
    // Calculate expiration time
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + durationHours);
    
    // Update guest authorization details
    guest.authorized = true;
    guest.authorizedAt = now;
    guest.expiresAt = expiresAt;
    guest.status = 'authorized';
    guest.accessType = 'admin';
    
    await guest.save();
    
    // Try to authorize with UniFi Controller
    try {
      await unifiService.authorizeGuest({
        mac: guest.mac,
        minutesDuration: durationHours * 60,
        name: guest.name || 'Guest'
      });
    } catch (unifiError) {
      console.error('UniFi authorization error:', unifiError);
      // Continue anyway - we'll handle this manually if needed
    }
    
    res.status(200).json({
      success: true,
      message: 'Guest authorized successfully',
      data: {
        guestId: guest._id,
        mac: guest.mac,
        expiresAt: guest.expiresAt,
        durationHours
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/guests/:id/unauthorize
 * @desc    Unauthorize a guest
 * @access  Admin
 */
exports.unauthorizeGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }
    
    // Update guest
    guest.authorized = false;
    guest.status = 'disconnected';
    guest.disconnectedAt = new Date();
    
    await guest.save();
    
    // Try to unauthorize with UniFi Controller
    try {
      await unifiService.unauthorizeGuest(guest.mac);
    } catch (unifiError) {
      console.error('UniFi unauthorization error:', unifiError);
      // Continue anyway - we'll handle this manually if needed
    }
    
    res.status(200).json({
      success: true,
      message: 'Guest unauthorized successfully',
      data: {
        guestId: guest._id,
        mac: guest.mac,
        status: guest.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/vouchers/generate
 * @desc    Generate vouchers
 * @access  Admin
 */
exports.generateVouchers = async (req, res, next) => {
  try {
    const {
      count = 1,
      planId,
      multipleUse = false,
      maxRedemptions = 1,
      validityDays
    } = req.body;
    
    // Validate inputs
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }
    
    // Check if plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    // Set validity period if provided
    const options = {
      count: Math.min(count, 100), // Limit to max 100 vouchers at once
      planId,
      createdById: req.user._id,
      multipleUse,
      maxRedemptions: multipleUse ? maxRedemptions : 1
    };
    
    if (validityDays) {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);
      options.validUntil = validUntil;
    }
    
    // Generate vouchers
    const vouchers = await Voucher.generateBatch(options);
    
    res.status(201).json({
      success: true,
      message: `${vouchers.length} vouchers generated successfully`,
      data: vouchers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/vouchers
 * @desc    Get all vouchers with filtering and pagination
 * @access  Admin
 */
exports.getAllVouchers = async (req, res, next) => {
  try {
    const { status, code, batchId, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    // Add filters if provided
    if (status) query.status = status;
    if (code) query.code = new RegExp(code, 'i');
    if (batchId) query.batchId = batchId;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Voucher.countDocuments(query);
    
    // Get paginated results
    const vouchers = await Voucher.find(query)
      .populate('planId', 'name duration')
      .populate('createdById', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: vouchers.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: vouchers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/vouchers/:id
 * @desc    Get voucher details
 * @access  Admin
 */
exports.getVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id)
      .populate('planId')
      .populate('createdById', 'username firstName lastName')
      .populate({
        path: 'redeemedBy.guestId',
        select: 'mac email ip authorizedAt expiresAt'
      });
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: voucher
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/vouchers/:id/revoke
 * @desc    Revoke a voucher
 * @access  Admin
 */
exports.revokeVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }
    
    // Check if voucher can be revoked
    if (voucher.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot revoke voucher with status: ${voucher.status}`
      });
    }
    
    // Revoke voucher
    voucher.status = 'revoked';
    await voucher.save();
    
    // Get guests who used this voucher
    const guests = await Guest.find({
      voucherId: voucher._id,
      accessType: 'voucher',
      authorized: true
    });
    
    // Unauthorize each guest
    for (const guest of guests) {
      guest.authorized = false;
      guest.status = 'disconnected';
      guest.disconnectedAt = new Date();
      await guest.save();
      
      // Try to unauthorize with UniFi Controller
      try {
        await unifiService.unauthorizeGuest(guest.mac);
      } catch (unifiError) {
        console.error('UniFi unauthorization error:', unifiError);
        // Continue anyway - we'll handle this manually if needed
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Voucher revoked successfully. ${guests.length} guests disconnected.`,
      data: {
        voucherId: voucher._id,
        code: voucher.code,
        status: voucher.status,
        disconnectedGuests: guests.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/settings
 * @desc    Update system settings
 * @access  Admin
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Settings array is required'
      });
    }
    
    const updatedSettings = [];
    
    // Update each setting
    for (const setting of settings) {
      if (!setting.key || setting.value === undefined) {
        continue;
      }
      
      try {
        const updatedSetting = await Setting.findOneAndUpdate(
          { key: setting.key },
          { value: setting.value, updatedBy: req.user._id },
          { new: true, runValidators: true }
        );
        
        if (updatedSetting) {
          updatedSettings.push(updatedSetting);
        }
      } catch (settingError) {
        console.error(`Error updating setting ${setting.key}:`, settingError);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `${updatedSettings.length} settings updated successfully`,
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/settings
 * @desc    Get all system settings
 * @access  Admin
 */
exports.getSettings = async (req, res, next) => {
  try {
    const { group } = req.query;
    
    let settings;
    
    if (group) {
      settings = await Setting.find({ group }).sort('key');
    } else {
      settings = await Setting.find().sort('group key');
    }
    
    // Group settings by their group
    const groupedSettings = settings.reduce((acc, setting) => {
      acc[setting.group] = acc[setting.group] || [];
      acc[setting.group].push(setting);
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      count: settings.length,
      data: {
        settings,
        groupedSettings
      }
    });
  } catch (error) {
    next(error);
  }
};
