const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const qrcode = require('qrcode');
const mockStore = require('../utils/mockStore');
const sendEmail = require('../utils/sendEmail');

const isDbConnected = () => mongoose.connection.readyState === 1;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dataverse_secret_key_2026', {
    expiresIn: '30d'
  });
};

const generateSymposiumCode = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `DV2026-REG-${randomNum}`;
};

// @desc    Register a new Student
// @route   POST /api/auth/register-student
exports.registerStudent = async (req, res) => {
  try {
    const {
      name, email, password, collegeName, department, year,
      phone, gender, dateOfBirth, address, emergencyContact
    } = req.body;

    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !password || !name || !collegeName) {
      return res.status(400).json({ success: false, message: 'Please fill all required registration fields' });
    }

    if (isDbConnected()) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email address already registered' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: cleanEmail,
        password: hashedPassword,
        role: 'student',
        isEmailVerified: true
      });

      let symposiumCode = generateSymposiumCode();
      let codeExists = await Student.findOne({ symposiumCode });
      while (codeExists) {
        symposiumCode = generateSymposiumCode();
        codeExists = await Student.findOne({ symposiumCode });
      }

      const qrPayload = JSON.stringify({ symposiumCode, name, collegeName, department, email: cleanEmail });
      const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

      const student = await Student.create({
        user: user._id,
        symposiumCode,
        registerNumber: 'N/A',
        collegeName,
        department: department || 'Computer Science & Engineering',
        year: year || 'III',
        email: cleanEmail,
        phone: phone || 'N/A',
        gender: gender || 'Male',
        dateOfBirth,
        address,
        profilePhoto: 'N/A',
        collegeIdCard: 'N/A',
        emergencyContact,
        foodPreference: 'N/A',
        accommodationRequired: 'N/A',
        verificationStatus: 'Pending',
        qrCodeData: qrCodeDataUrl
      });

      const token = generateToken(user._id);

      const emailResult = await sendEmail({
        to: cleanEmail,
        subject: 'Welcome to DATAVERSE 2026 - Symposium Registration Confirmed',
        html: `<h3>Dear ${name},</h3><p>Thank you for registering for DATAVERSE 2026.</p><p>Your unique Symposium Ticket Code is: <strong>${symposiumCode}</strong></p><p>Please log in to your Student Dashboard to view your digital ticket and QR code.</p>`
      });

      return res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        student,
        emailStatus: emailResult
      });
    } else {
      // In-Memory Fallback
      const existing = mockStore.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email address already registered' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = 'u' + (mockStore.users.length + 1);
      const user = { _id: userId, name, email: cleanEmail, password: hashedPassword, role: 'student', isEmailVerified: true };
      mockStore.users.push(user);

      let symposiumCode = generateSymposiumCode();
      let codeExists = mockStore.students.find(s => s.symposiumCode === symposiumCode);
      while (codeExists) {
        symposiumCode = generateSymposiumCode();
        codeExists = mockStore.students.find(s => s.symposiumCode === symposiumCode);
      }

      const qrPayload = JSON.stringify({ symposiumCode, name, collegeName, department, email: cleanEmail });
      const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

      const studentId = 's' + (mockStore.students.length + 1);
      const student = {
        _id: studentId,
        user: userId,
        symposiumCode,
        registerNumber: 'N/A',
        collegeName,
        department: department || 'Computer Science & Engineering',
        year: year || 'III',
        email: cleanEmail,
        phone: phone || 'N/A',
        gender: gender || 'Male',
        dateOfBirth,
        address,
        profilePhoto: 'N/A',
        collegeIdCard: 'N/A',
        emergencyContact,
        foodPreference: 'N/A',
        accommodationRequired: 'N/A',
        verificationStatus: 'Pending',
        isCheckedIn: false,
        qrCodeData: qrCodeDataUrl
      };

      mockStore.students.push(student);
      const token = generateToken(userId);

      const emailResult = await sendEmail({
        to: cleanEmail,
        subject: 'Welcome to DATAVERSE 2026 - Symposium Registration Confirmed',
        html: `<h3>Dear ${name},</h3><p>Your unique Symposium Ticket Code is: <strong>${symposiumCode}</strong></p>`
      });

      return res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        student,
        emailStatus: emailResult
      });
    }
  } catch (error) {
    console.error('Register Student Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

// @desc    Universal Login (Student, Admin, Coordinator, Volunteer)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = generateToken(user._id);
      let student = null;
      if (user.role === 'student') student = await Student.findOne({ user: user._id });

      return res.status(200).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        student
      });
    } else {
      const user = mockStore.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = generateToken(user._id);
      let student = null;
      if (user.role === 'student') student = mockStore.students.find(s => s.user === user._id || String(s.user) === String(user._id));

      return res.status(200).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        student
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server login error' });
  }
};

// @desc    Get Current Logged in User Profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (isDbConnected()) {
      const user = await User.findById(userId).select('-password');
      let student = null;
      if (user && user.role === 'student') student = await Student.findOne({ user: user._id });
      return res.status(200).json({ success: true, user, student });
    } else {
      const user = mockStore.users.find(u => u._id === userId || String(u._id) === String(userId));
      let student = null;
      if (user && user.role === 'student') student = mockStore.students.find(s => s.user === user._id || String(s.user) === String(user._id));
      return res.status(200).json({ success: true, user, student });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email address' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpire = Date.now() + 15 * 60 * 1000;

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: 'No account found with this email address' });
      }

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = resetExpire;
      await user.save();
    } else {
      const user = mockStore.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
      if (!user) {
        return res.status(404).json({ success: false, message: 'No account found with this email address' });
      }
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = resetExpire;
    }

    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: 'DATAVERSE 2026 - Password Reset Verification Code',
      html: `<h3>Password Reset Request</h3><p>Your 6-digit password reset OTP is: <strong style="font-size: 20px; color: #4f46e5;">${resetToken}</strong></p><p>This OTP will expire in 15 minutes.</p>`
    });

    res.status(200).json({
      success: true,
      message: 'Password reset OTP has been generated.',
      emailStatus: emailResult,
      devOtp: process.env.NODE_ENV !== 'production' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Forgot password server error' });
  }
};

// @desc    Reset Password with Verified OTP Token
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail || !token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP code, and new password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (isDbConnected()) {
      const user = await User.findOne({
        email: cleanEmail,
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP token' });
      }

      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();

      return res.status(200).json({ success: true, message: 'Password reset successfully! You can now log in with your new password.' });
    } else {
      const user = mockStore.users.find(u => 
        u.email.toLowerCase().trim() === cleanEmail &&
        u.resetPasswordToken === token &&
        u.resetPasswordExpire > Date.now()
      );

      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP token' });
      }

      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;

      return res.status(200).json({ success: true, message: 'Password reset successfully! You can now log in with your new password.' });
    }
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Reset password server error' });
  }
};
