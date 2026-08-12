const express = require('express');
const router = express.Router();
const { submitContact, getMessages } = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

router.post('/submit', submitContact);
router.get('/messages', protect, authorize('super_admin'), getMessages);

module.exports = router;