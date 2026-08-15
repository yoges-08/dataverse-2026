const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyTeamEvents,
  getMyTeamForEvent,
  getAvailableTeammates,
  addTeamMember,
  removeTeamMember
} = require('../controllers/teamController');

// All routes require a logged-in student session. Team access is authorized by
// membership — every member has equal permissions to add/remove teammates.

router.get('/my-events', protect, getMyTeamEvents);
router.get('/event/:eventId', protect, getMyTeamForEvent);
router.get('/event/:eventId/available', protect, getAvailableTeammates);
router.post('/event/:eventId/members', protect, addTeamMember);
router.delete('/event/:eventId/members/:studentId', protect, removeTeamMember);

module.exports = router;