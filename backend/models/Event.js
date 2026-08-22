const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Technical', 'Non-Technical'], 
    required: true 
  },
  tagline: { type: String, default: '' },
  description: { type: String, required: true },
  rules: [{ type: String }],
  venue: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, default: '' },
  registrationDeadline: { type: String, required: true },
  maxParticipants: { type: Number, default: 100 },
  currentRegistrations: { type: Number, default: 0 },
  teamLimit: { type: Number, default: 0 },
  facultyCoordinator: { 
    name: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  studentCoordinator: { 
    name: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  prizes: {
    first: { type: String, default: '₹5,000 + Trophy & Certificate' },
    second: { type: String, default: '₹3,000 + Trophy & Certificate' },
    third: { type: String, default: '₹1,500 + Certificate' }
  },
  bannerImage: { type: String, default: '/uploads/events/default.jpg' },
  pdfRequired: { type: Boolean, default: false },
  requiresLanguageChoice: { type: Boolean, default: false },
  winnersUploaded: { type: Boolean, default: false },
  winners: [
    {
      position: String,
      studentName: String,
      college: String,
      regNo: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
