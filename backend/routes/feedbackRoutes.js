const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  checkFeedback,
  submitFeedback,
  deleteFeedback,
  getAllFeedback,
  exportFeedbackDocx
} = require('../controllers/feedbackController');

// Public route: instant duplicate check by email
router.get('/feedback/check', checkFeedback);
router.get('/check', checkFeedback);

// Public route: submit feedback (anyone, registered or non-registered)
router.post('/feedback', submitFeedback);
router.post('/', submitFeedback);

// Admin-only routes (super_admin)
router.get('/admin/feedback', protect, authorize('super_admin'), getAllFeedback);
router.get('/admin/feedback/export', protect, authorize('super_admin'), exportFeedbackDocx);
router.delete('/admin/feedback/:id', protect, authorize('super_admin'), deleteFeedback);
router.delete('/:id', protect, authorize('super_admin'), deleteFeedback);
router.get('/all', protect, authorize('super_admin'), getAllFeedback);
router.get('/export', protect, authorize('super_admin'), exportFeedbackDocx);

module.exports = router;
