const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['Registered', 'Attended', 'Cancelled'], default: 'Registered' },
  language: { type: String, enum: ['Python', 'C', 'C++'] },
  paperPdfUrl: { type: String, default: null },
  teamMembers: {
    type: [
      {
        name: { type: String, trim: true },
        phone: { type: String, trim: true }
      }
    ],
    default: []
  },
  registrationDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Prevent duplicate student registration for the same event
registrationSchema.index({ student: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1 });
registrationSchema.index({ student: 1 });

module.exports = mongoose.model('Registration', registrationSchema);

