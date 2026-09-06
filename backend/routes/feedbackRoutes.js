const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  checkFeedback,
  submitFeedback,
  cleanupFeedbackIndexes
} = require('../controllers/feedbackController');

// Maintenance & index cleanup (Restricted to Super Admin)
router.get('/cleanup-indexes', protect, authorize('super_admin'), cleanupFeedbackIndexes);

// Public route: instant duplicate check by email
router.get('/check', checkFeedback);
router.get('/feedback/check', checkFeedback);

// Public route: submit feedback (anyone, registered or non-registered)
router.post('/', submitFeedback);
router.post('/feedback', submitFeedback);

module.exports = router;
