const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  registerStudent,
  login,
  getMe,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

router.post('/register-student', authLimiter, registerStudent);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

module.exports = router;

