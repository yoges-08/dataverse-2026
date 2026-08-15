const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  // Internal only: references the student who first created the team. Grants
  // NO special permissions — every member has equal authority to add/remove.
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  college: { type: String, required: true },
  teamSize: { type: Number, required: true },
  status: { type: String, enum: ['Open', 'Complete', 'Incomplete'], default: 'Open' },
  editCode: { type: String },
  members: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
      addedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// A student can only be on one team per event (used for leader/creator id).
teamSchema.index({ event: 1, leader: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
