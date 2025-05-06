/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize, updateLastLogin } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login, updateLastLogin);
router.post('/initadmin', authController.initializeAdmin);

// Protected routes
router.use(protect); // All routes below this line require authentication

// All authenticated users
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.put('/updateprofile', authController.updateProfile);
router.put('/changepassword', authController.changePassword);

// Admin only routes
router.post('/register', authorize('admin', 'superadmin'), authController.register);

module.exports = router;
