/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const sampleDataController = require('../controllers/sampleDataController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Guest management
router.get('/guests', adminController.getAllGuests);
router.get('/guests/:id', adminController.getGuest);
router.post('/guests/:id/authorize', adminController.authorizeGuest);
router.post('/guests/:id/unauthorize', adminController.unauthorizeGuest);

// Voucher management
router.post('/vouchers/generate', adminController.generateVouchers);
router.get('/vouchers', adminController.getAllVouchers);
router.get('/vouchers/:id', adminController.getVoucher);
router.post('/vouchers/:id/revoke', adminController.revokeVoucher);

// Settings management
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSettings);

// Sample data
router.post('/sample-data', sampleDataController.initializeSampleData);

module.exports = router;
