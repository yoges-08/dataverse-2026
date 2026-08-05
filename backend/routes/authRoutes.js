const express = require('express');
const router = express.Router();
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

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
