const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  registerStudent,
  login,
  getMe,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

router.post('/register-student', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'collegeIdCard', maxCount: 1 }
]), registerStudent);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' }
});

router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
