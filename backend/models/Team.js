const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  college: { type: String, required: true },
  teamSize: { type: Number, required: true },
  status: { type: String, enum: ['Open', 'Complete', 'Incomplete'], default: 'Open' },
  editCode: { type: String, required: true, unique: true },
  members: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
      isLeader: { type: Boolean, default: false },
      addedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// A student can only lead one team per event.
teamSchema.index({ event: 1, leader: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
