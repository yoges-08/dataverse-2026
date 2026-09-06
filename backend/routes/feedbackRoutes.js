const express = require('express');
const router = express.Router();
const {
  checkFeedback,
  submitFeedback,
  cleanupFeedbackIndexes
} = require('../controllers/feedbackController');

// Maintenance & index cleanup
router.get('/cleanup-indexes', cleanupFeedbackIndexes);

// Public route: instant duplicate check by email
router.get('/check', checkFeedback);
router.get('/feedback/check', checkFeedback);

// Public route: submit feedback (anyone, registered or non-registered)
router.post('/', submitFeedback);
router.post('/feedback', submitFeedback);

module.exports = router;
