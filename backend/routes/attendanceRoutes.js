const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  verifyStudent,
  checkInStudent,
  getAttendanceLogs
} = require('../controllers/attendanceController');

router.use(protect);
router.use(authorize('super_admin', 'volunteer', 'coordinator'));

router.post('/verify', verifyStudent);
router.post('/check-in', checkInStudent);
router.get('/logs', getAttendanceLogs);

module.exports = router;
