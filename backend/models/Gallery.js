const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['Technical', 'Non-Technical', 'Inauguration', 'Cultural', 'Valedictory'], default: 'Technical' },
  year: { type: String, default: '2026' },
  imageUrl: { type: String, required: true },
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
