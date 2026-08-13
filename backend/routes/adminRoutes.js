const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAnalytics,
  getAllStudents,
  updateStudentStatus,
  deleteStudent,
  createStaff,
  getStaffList,
  exportStudentsExcel
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('super_admin'));

router.get('/analytics', getAnalytics);
router.get('/students', getAllStudents);
router.get('/students/export', exportStudentsExcel);
router.put('/students/:id/status', updateStudentStatus);
router.delete('/students/:id', deleteStudent);
router.post('/staff', createStaff);
router.get('/staff', getStaffList);

module.exports = router;
