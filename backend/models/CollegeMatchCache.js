const mongoose = require('mongoose');

const collegeMatchCacheSchema = new mongoose.Schema({
  pairKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nameA: {
    type: String,
    required: true
  },
  nameB: {
    type: String,
    required: true
  },
  isMatch: {
    type: Boolean,
    required: true
  },
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low', 'deterministic'],
    default: 'high'
  },
  reason: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['ai', 'admin_override', 'deterministic'],
    default: 'ai'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CollegeMatchCache', collegeMatchCacheSchema);
