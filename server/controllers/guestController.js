/**
 * Guest Controller
 * Handles guest portal functionality for WiFi access
 */

const Guest = require('../models/Guest');
const Voucher = require('../models/Voucher');
const Plan = require('../models/Plan');
const unifiService = require('../services/unifi/unifiService');

/**
 * @route   GET /api/guest/info
 * @desc    Get information about the current guest based on MAC address
 * @access  Public
 */
exports.getGuestInfo = async (req, res, next) => {
  try {
    // Get MAC address from request
    const mac = req.query.mac || req.headers['x-client-mac'];
    
    if (!mac) {
      return res.status(400).json({
        success: false,
        message: 'MAC address is required'
      });
    }
    
    // Format MAC address
    const formattedMac = mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase().match(/.{1,2}/g).join(':');
    
    // Find guest in our database
    const guest = await Guest.findOne({ mac: formattedMac })
      .populate('planId', 'name price currency duration bandwidth')
      .populate('paymentId', 'amount currency status processedAt');
    
    // Try to get additional info from UniFi controller
    let unifiInfo = null;
    try {
      unifiInfo = await unifiService.getClientInfo(formattedMac);
    } catch (unifiError) {
      console.error('UniFi client info error:', unifiError);
      // Continue without UniFi info
    }
    
    // Check if guest exists in our database
    if (!guest) {
      // Return minimal info if we have UniFi data
      if (unifiInfo && unifiInfo.success) {
        return res.status(200).json({
          success: true,
          data: {
            mac: formattedMac,
            isAuthorized: unifiInfo.isAuthorized,
            ipAddress: unifiInfo.ipAddress,
            hostname: unifiInfo.hostname,
            lastSeen: unifiInfo.lastSeen,
            dataUsage: {
              download: unifiInfo.rxBytes,
              upload: unifiInfo.txBytes,
              total: unifiInfo.rxBytes + unifiInfo.txBytes
            },
            unifiData: unifiInfo
          }
        });
      }
      
      // No guest found in either system
      return res.status(404).json({
        success: false,
        message: 'Guest not found',
        data: {
          mac: formattedMac,
          isAuthorized: false
        }
      });
    }
    
    // Check if guest access is expired
    const isExpired = guest.isExpired();
    
    // If expired but still shown as authorized, update status
    if (isExpired && guest.authorized) {
      guest.authorized = false;
      guest.status = 'expired';
      await guest.save();
      
      // Try to unauthorize with UniFi Controller
      try {
        await unifiService.unauthorizeGuest(formattedMac);
      } catch (unifiError) {
        console.error('UniFi unauthorization error:', unifiError);
        // Continue anyway - we'll handle this manually if needed
      }
    }
    
    // Merge UniFi data with our database info
    const guestInfo = {
      _id: guest._id,
      mac: guest.mac,
      ip: guest.ip || (unifiInfo?.ipAddress || ''),
      email: guest.email,
      accessType: guest.accessType,
      status: guest.status,
      isAuthorized: guest.authorized && !isExpired,
      authorizedAt: guest.authorizedAt,
      expiresAt: guest.expiresAt,
      remainingTime: guest.getRemainingTime(),
      isExpired: isExpired,
      plan: guest.planId ? {
        name: guest.planId.name,
        price: guest.planId.price,
        currency: guest.planId.currency,
        bandwidth: guest.planId.bandwidth
      } : null,
      payment: guest.paymentId ? {
        amount: guest.paymentId.amount,
        currency: guest.paymentId.currency,
        status: guest.paymentId.status,
        date: guest.paymentId.processedAt
      } : null,
      dataUsage: {
        download: guest.dataUsage.download || (unifiInfo?.rxBytes || 0),
        upload: guest.dataUsage.upload || (unifiInfo?.txBytes || 0),
        total: guest.dataUsage.total || ((unifiInfo?.rxBytes || 0) + (unifiInfo?.txBytes || 0))
      },
      unifiData: unifiInfo && unifiInfo.success ? unifiInfo : null
    };
    
    // Update data usage if we got new info from UniFi
    if (unifiInfo && unifiInfo.success && 
        (unifiInfo.rxBytes !== guest.dataUsage.download || 
         unifiInfo.txBytes !== guest.dataUsage.upload)) {
      guest.updateDataUsage(unifiInfo.rxBytes, unifiInfo.txBytes);
      // Don't await this to avoid slowing down the response
    }
    
    res.status(200).json({
      success: true,
      data: guestInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/guest/redeem-voucher
 * @desc    Redeem a voucher for WiFi access
 * @access  Public
 */
exports.redeemVoucher = async (req, res, next) => {
  try {
    const { code, mac } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Voucher code is required'
      });
    }
    
    if (!mac) {
      return res.status(400).json({
        success: false,
        message: 'MAC address is required'
      });
    }
    
    // Format MAC address
    const formattedMac = mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase().match(/.{1,2}/g).join(':');
    
    // Find the voucher
    const voucher = await Voucher.findOne({ code: code.toUpperCase() })
      .populate('planId');
    
    // Check if voucher exists
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Invalid voucher code'
      });
    }
    
    // Check if voucher is valid
    if (!voucher.isValid()) {
      return res.status(400).json({
        success: false,
        message: `Voucher is ${voucher.status}`
      });
    }
    
    // Find or create guest
    let guest = await Guest.findOne({ mac: formattedMac });
    
    if (!guest) {
      guest = new Guest({
        mac: formattedMac,
        ip: req.ip,
        accessType: 'voucher',
        voucherId: voucher._id,
        planId: voucher.planId._id
      });
    } else {
      // Update existing guest
      guest.accessType = 'voucher';
      guest.voucherId = voucher._id;
      guest.planId = voucher.planId._id;
      guest.ip = req.ip;
    }
    
    // Redeem the voucher
    await voucher.redeem(guest._id);
    
    // Get values from the voucher or associated plan
    const plan = voucher.planId;
    const durationInSeconds = plan.getDurationInSeconds();
    const uploadBandwidth = voucher.bandwidth?.upload || plan.bandwidth.upload;
    const downloadBandwidth = voucher.bandwidth?.download || plan.bandwidth.download;
    
    // Calculate expiration time
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationInSeconds * 1000);
    
    // Update guest authorization details
    guest.authorized = true;
    guest.authorizedAt = now;
    guest.expiresAt = expiresAt;
    guest.status = 'authorized';
    
    await guest.save();
    
    // Try to authorize with UniFi Controller
    try {
      await unifiService.authorizeGuest({
        mac: formattedMac,
        minutesDuration: Math.floor(durationInSeconds / 60),
        uploadBandwidth: uploadBandwidth,
        downloadBandwidth: downloadBandwidth,
        name: 'Voucher Guest'
      });
    } catch (unifiError) {
      console.error('UniFi authorization error:', unifiError);
      // Continue anyway - we'll handle this manually if needed
    }
    
    res.status(200).json({
      success: true,
      message: 'Voucher redeemed successfully',
      data: {
        guestId: guest._id,
        mac: guest.mac,
        planName: plan.name,
        expiresAt: guest.expiresAt,
        durationMinutes: Math.floor(durationInSeconds / 60)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/guest/network-info
 * @desc    Get network information for the guest portal
 * @access  Public
 */
exports.getNetworkInfo = async (req, res, next) => {
  try {
    // Get network settings - in a real implementation, these would come from
    // Settings model or UniFi service
    const networkInfo = {
      networkName: 'UniFi Guest Network',
      networkProvider: 'UniFi Guest Portal',
      termsAndConditions: 'By using this network, you agree to our terms and conditions.',
      privacyPolicy: 'https://example.com/privacy-policy',
      contactInfo: 'support@example.com',
      availableVouchers: true,
      availablePayment: true
    };
    
    res.status(200).json({
      success: true,
      data: networkInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/guest/plans
 * @desc    Get available plans for purchase
 * @access  Public
 */
exports.getAvailablePlans = async (req, res, next) => {
  try {
    // Get all active plans, sorted by sort order
    const plans = await Plan.find({ isActive: true })
      .sort('sortOrder');
    
    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/guest/device-info
 * @desc    Get device information from client headers/fingerprint
 * @access  Public
 */
exports.getDeviceInfo = async (req, res, next) => {
  try {
    // Get device info from headers
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip;
    const mac = req.query.mac || req.headers['x-client-mac'] || '';
    
    // Get device type based on user agent
    let deviceType = 'other';
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/windows|macintosh|linux/i.test(userAgent)) {
      deviceType = 'desktop';
    }
    
    // Get browser and OS info from user agent
    let browser = 'Unknown';
    let os = 'Unknown';
    
    // Simple browser detection
    if (/chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';
    else if (/opera|opr/i.test(userAgent)) browser = 'Opera';
    else if (/msie|trident/i.test(userAgent)) browser = 'Internet Explorer';
    
    // Simple OS detection
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/macintosh|mac os/i.test(userAgent)) os = 'MacOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
    
    const deviceInfo = {
      ipAddress,
      mac: mac ? mac.replace(/[^a-fA-F0-9]/g, '').toLowerCase().match(/.{1,2}/g).join(':') : '',
      userAgent,
      deviceType,
      browser,
      os,
      timestamp: new Date()
    };
    
    res.status(200).json({
      success: true,
      data: deviceInfo
    });
  } catch (error) {
    next(error);
  }
};
