const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authValidators } = require('../middleware/validateMiddleware');

/**
 * Auth Routes
 * Handles user authentication and profile management
 */

router.post('/register', authValidators.register, register);
router.post('/login', authValidators.login, login);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
