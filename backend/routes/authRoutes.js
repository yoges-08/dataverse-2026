const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerStudent,
  login,
  getMe,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

router.post('/register-student', registerStudent);

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
