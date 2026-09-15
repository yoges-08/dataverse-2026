const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { certGenLimiter } = require('../middleware/rateLimiter');
const {
  getMyCertificates,
  getAllCertificates,
  generateCertificate,
  generateBulkCertificates,
  deleteCertificate,
  deleteAllCertificates,
  verifyCertificate
} = require('../controllers/certificateController');

router.get('/my-certificates', protect, getMyCertificates);
router.get('/all', protect, authorize('super_admin', 'coordinator'), getAllCertificates);
router.post('/generate', protect, authorize('super_admin', 'coordinator'), certGenLimiter, generateCertificate);
router.post('/generate-bulk', protect, authorize('super_admin', 'coordinator'), generateBulkCertificates);
router.delete('/delete-all', protect, authorize('super_admin', 'coordinator'), deleteAllCertificates);
router.delete('/:id', protect, authorize('super_admin', 'coordinator'), deleteCertificate);
router.get('/verify/:certNo', verifyCertificate);

module.exports = router;
