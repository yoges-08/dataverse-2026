const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symposiumCode: { type: String, required: true, unique: true },
  registerNumber: { type: String, default: 'N/A' },
  collegeName: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String, default: 'Male' },
  dateOfBirth: { type: String, default: '' },
  address: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  foodPreference: { type: String, default: 'N/A' },
  accommodationRequired: { type: String, default: 'N/A' },
  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  rejectionReason: { type: String, default: '' },
  isCheckedIn: { type: Boolean, default: false },
  checkInTime: { type: Date, default: null },
  checkedInBy: { type: String, default: null },
  qrCodeData: { type: String, required: true },
  isSpotRegistration: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
