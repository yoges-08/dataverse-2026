const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTeamByCode,
  addTeamMember,
  removeTeamMember,
  updateTeamSize,
  getAdminTeams
} = require('../controllers/teamController');

// Public via the private edit code (shared with the team leader by email).
router.get('/:editCode', getTeamByCode);
router.post('/:editCode/members', addTeamMember);
router.delete('/:editCode/members/:memberId', removeTeamMember);
router.put('/:editCode/team-size', updateTeamSize);

// Admin / coordinator overview.
router.get('/admin/teams', protect, authorize('super_admin', 'coordinator'), getAdminTeams);

module.exports = router;