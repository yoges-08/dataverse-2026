const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  verifiedBy: { type: String, required: true }, // Volunteer name or ID
  deviceInfo: { type: String, default: 'Web QR Scanner' },
  checkInTime: { type: Date, default: Date.now },
  gate: { type: String, default: 'Main Entrance Gate A' }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
