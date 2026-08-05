const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symposiumCode: { type: String, required: true, unique: true },
  registerNumber: { type: String, required: true },
  collegeName: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String, required: true },
  dateOfBirth: { type: String },
  address: { type: String },
  profilePhoto: { type: String, default: '/uploads/default-avatar.png' },
  collegeIdCard: { type: String, default: '/uploads/default-id.png' },
  emergencyContact: { type: String },
  foodPreference: { type: String, enum: ['Veg', 'Non-Veg'], default: 'Veg' },
  accommodationRequired: { type: String, enum: ['Yes', 'No'], default: 'No' },
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
