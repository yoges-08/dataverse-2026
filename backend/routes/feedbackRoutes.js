const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  submitFeedback,
  getAllFeedback,
  exportFeedbackDocx
} = require('../controllers/feedbackController');

// Public route: submit feedback (anyone, registered or non-registered)
router.post('/feedback', submitFeedback);
router.post('/', submitFeedback);

// Admin-only routes (super_admin)
router.get('/admin/feedback', protect, authorize('super_admin'), getAllFeedback);
router.get('/admin/feedback/export', protect, authorize('super_admin'), exportFeedbackDocx);
router.get('/all', protect, authorize('super_admin'), getAllFeedback);
router.get('/export', protect, authorize('super_admin'), exportFeedbackDocx);

module.exports = router;
