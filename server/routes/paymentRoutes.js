/**
 * Payment Routes
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Public routes for payment processing
router.get('/providers', paymentController.getPaymentProviders);
router.post('/initialize', paymentController.initializePayment);
router.post('/confirm', paymentController.confirmPayment);
router.post('/webhook/:provider', paymentController.handleWebhook);

// Admin-only routes
router.use(protect); // All routes below this line require authentication
router.use(authorize('admin', 'superadmin')); // And also require admin role

router.get('/', paymentController.getAllPayments);
router.get('/:id', paymentController.getPayment);
router.post('/:id/refund', paymentController.refundPayment);

module.exports = router;
