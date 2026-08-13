const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const {
  getAnalytics,
  getAllStudents,
  updateStudentStatus,
  deleteStudent,
  createStaff,
  getStaffList,
  downloadStudentTemplate,
  importStudents
} = require('../controllers/adminController');

// Excel/CSV files are parsed in memory; no need to persist them to disk.
const excelUpload = multer({ storage: multer.memoryStorage() });

router.use(protect);
router.use(authorize('super_admin'));

router.get('/analytics', getAnalytics);
router.get('/students', getAllStudents);
router.get('/students/import-template', downloadStudentTemplate);
router.post('/students/import', excelUpload.single('file'), importStudents);
router.put('/students/:id/status', updateStudentStatus);
router.delete('/students/:id', deleteStudent);
router.post('/staff', createStaff);
router.get('/staff', getStaffList);

module.exports = router;
