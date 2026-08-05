const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyCertificates,
  generateCertificate,
  verifyCertificate
} = require('../controllers/certificateController');

router.get('/my-certificates', protect, getMyCertificates);
router.post('/generate', protect, authorize('super_admin', 'coordinator'), generateCertificate);
router.get('/verify/:certNo', verifyCertificate);

module.exports = router;
