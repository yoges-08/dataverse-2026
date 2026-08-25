const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'coordinator', 'volunteer', 'student', 'co_organizer'], 
    default: 'student' 
  },
  isEmailVerified: { type: Boolean, default: true },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpire: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
