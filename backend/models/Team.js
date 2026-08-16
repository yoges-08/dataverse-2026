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

// DB-level backstop for the creation race: the SAME student can never appear
// as a member of two teams for the same event, no matter how many requests
// pass their existence check before either insert commits. The second insert
// fails with E11000 and callers return the already-existing team instead.
teamSchema.index({ event: 1, 'members.student': 1 }, { unique: true });

// Safety net: never persist the same student twice in a team.
teamSchema.pre('save', function (next) {
  if (Array.isArray(this.members)) {
    const seen = new Set();
    this.members = this.members.filter(m => {
      const id = String(m.student && (m.student._id || m.student) || '');
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);
