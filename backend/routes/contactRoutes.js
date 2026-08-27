const express = require('express');
const router = express.Router();
const { submitContact, getMessages } = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimiter');

router.post('/submit', contactLimiter, submitContact);
router.get('/messages', protect, authorize('super_admin'), getMessages);

module.exports = router;