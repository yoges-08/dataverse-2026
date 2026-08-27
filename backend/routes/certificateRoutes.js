const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { certGenLimiter } = require('../middleware/rateLimiter');
const {
  getMyCertificates,
  getAllCertificates,
  generateCertificate,
  deleteCertificate,
  verifyCertificate
} = require('../controllers/certificateController');

router.get('/my-certificates', protect, getMyCertificates);
router.get('/all', protect, authorize('super_admin', 'coordinator'), getAllCertificates);
router.post('/generate', protect, authorize('super_admin', 'coordinator'), certGenLimiter, generateCertificate);
router.delete('/:id', protect, authorize('super_admin', 'coordinator'), deleteCertificate);
router.get('/verify/:certNo', verifyCertificate);


module.exports = router;
