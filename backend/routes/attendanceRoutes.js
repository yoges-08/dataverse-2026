const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  verifyStudent,
  checkInStudent,
  getAttendanceLogs,
  serveFood,
  getFoodStats
} = require('../controllers/attendanceController');

router.use(protect);
router.use(authorize('super_admin', 'volunteer', 'coordinator'));

router.post('/verify', verifyStudent);
router.post('/check-in', checkInStudent);
router.get('/logs', getAttendanceLogs);
router.post('/food-scan', serveFood);
router.get('/food-stats', getFoodStats);

module.exports = router;
