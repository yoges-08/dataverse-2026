const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const {
  getGallery,
  addGalleryItem
} = require('../controllers/galleryController');

router.get('/', getGallery);
router.post('/', protect, authorize('super_admin'), upload.single('image'), addGalleryItem);

module.exports = router;
