const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateNo: { type: String, required: true, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  type: { type: String, enum: ['Participation', 'Winner', 'RunnerUp'], default: 'Participation' },
  issuedAt: { type: Date, default: Date.now },
  verificationQrCode: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
