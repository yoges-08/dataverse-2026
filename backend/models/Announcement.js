const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['Event Update', 'Venue Change', 'Schedule Change', 'Results', 'General'], default: 'General' },
  priority: { type: String, enum: ['Normal', 'High', 'Urgent'], default: 'Normal' },
  author: { type: String, default: 'Symposium Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
