const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAnalytics,
  getAllStudents,
  getRegistrants,
  updateStudentStatus,
  deleteStudent,
  removeRegistration,
  createStaff,
  getStaffList,
  exportStudentsExcel,
  exportStudentsByEventExcel
} = require('../controllers/adminController');

router.use(protect);

// Read-only routes (allow both super_admin and co_organizer)
router.get('/analytics', authorize('super_admin', 'co_organizer'), getAnalytics);
router.get('/students', authorize('super_admin', 'co_organizer'), getAllStudents);
router.get('/registrants', authorize('super_admin', 'co_organizer'), getRegistrants);

// Write/admin-only routes (keep locked to super_admin only, do NOT allow co_organizer)
router.get('/students/export', authorize('super_admin'), exportStudentsExcel);
router.get('/students/export-by-event', authorize('super_admin'), exportStudentsByEventExcel);
router.put('/students/:id/status', authorize('super_admin'), updateStudentStatus);
router.delete('/students/:id', authorize('super_admin'), deleteStudent);
router.delete('/registrations/:id', authorize('super_admin'), removeRegistration);
router.post('/staff', authorize('super_admin'), createStaff);
router.get('/staff', authorize('super_admin'), getStaffList);

module.exports = router;
