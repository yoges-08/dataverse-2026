const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  uploadWinners
} = require('../controllers/eventController');

router.get('/', getEvents);
router.get('/:id', getEventById);

router.post('/', protect, authorize('super_admin'), upload.single('bannerImage'), createEvent);
router.put('/:id', protect, authorize('super_admin'), upload.single('bannerImage'), updateEvent);
router.delete('/:id', protect, authorize('super_admin'), deleteEvent);

router.post('/:id/register', protect, upload.single('paperPdf'), registerForEvent);
router.post('/:id/winners', protect, authorize('super_admin', 'coordinator'), uploadWinners);

module.exports = router;
