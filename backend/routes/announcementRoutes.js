const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');

router.get('/', getAnnouncements);
router.post('/', protect, authorize('super_admin'), createAnnouncement);
router.delete('/:id', protect, authorize('super_admin'), deleteAnnouncement);

module.exports = router;
