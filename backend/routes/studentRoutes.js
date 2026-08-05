const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getRegisteredEvents,
  spotRegistration
} = require('../controllers/studentController');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.fields([{ name: 'profilePhoto', maxCount: 1 }]), updateProfile);
router.get('/registered-events', protect, getRegisteredEvents);
router.post('/spot-registration', protect, authorize('super_admin', 'volunteer', 'coordinator'), spotRegistration);

module.exports = router;
