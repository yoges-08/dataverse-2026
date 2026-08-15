const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getRegisteredEvents,
  spotRegistration
} = require('../controllers/studentController');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/registered-events', protect, getRegisteredEvents);
router.post('/spot-registration', protect, authorize('super_admin', 'volunteer', 'coordinator'), spotRegistration);

module.exports = router;
