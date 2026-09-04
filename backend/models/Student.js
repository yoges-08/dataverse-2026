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
  address: { type: String, default: '' },
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
  isSpotRegistration: { type: Boolean, default: false },
  isFoodServed: { type: Boolean, default: false },
  foodServedAt: { type: Date, default: null },
  foodServedBy: { type: String, default: null }
}, { timestamps: true });

studentSchema.index({ verificationStatus: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ collegeName: 1 });
studentSchema.index({ isCheckedIn: 1 });
studentSchema.index({ isFoodServed: 1 });
studentSchema.index({ user: 1 });

module.exports = mongoose.model('Student', studentSchema);

