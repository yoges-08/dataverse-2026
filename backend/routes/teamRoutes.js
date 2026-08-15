const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyTeamEvents,
  getMyTeamForEvent,
  getAvailableTeammates,
  addTeamMember,
  removeTeamMember,
  updateTeamSize
} = require('../controllers/teamController');

// All routes require a logged-in student session. Team access is authorized by
// membership (leader OR member), never by a shared edit-code link.

router.get('/my-events', protect, getMyTeamEvents);
router.get('/event/:eventId', protect, getMyTeamForEvent);
router.get('/event/:eventId/available', protect, getAvailableTeammates);
router.post('/event/:eventId/members', protect, addTeamMember);
router.delete('/event/:eventId/members/:studentId', protect, removeTeamMember);
router.put('/event/:eventId/team-size', protect, updateTeamSize);

module.exports = router;