const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const {
  getGallery,
  addGalleryItem,
  deleteGalleryItem
} = require('../controllers/galleryController');

router.get('/', getGallery);
router.post('/', protect, authorize('super_admin'), upload.single('image'), addGalleryItem);
router.delete('/:id', protect, authorize('super_admin'), deleteGalleryItem);

module.exports = router;
