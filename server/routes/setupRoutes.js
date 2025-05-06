/**
 * Setup Routes
 * Routes for first-time setup and configuration
 */

const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');
const { protect, authorize } = require('../middleware/auth');

// Public routes for initial setup
router.get('/status', setupController.getSetupStatus);
router.post('/admin', setupController.setupAdmin);

// Protected routes for configuration
router.post('/configuration', protect, authorize('admin', 'superadmin'), setupController.setupConfiguration);

module.exports = router;
