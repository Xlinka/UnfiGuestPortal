/**
 * Guest Routes
 */

const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');

// All guest routes are public
router.get('/info', guestController.getGuestInfo);
router.post('/redeem-voucher', guestController.redeemVoucher);
router.get('/network-info', guestController.getNetworkInfo);
router.get('/plans', guestController.getAvailablePlans);
router.get('/device-info', guestController.getDeviceInfo);

module.exports = router;
