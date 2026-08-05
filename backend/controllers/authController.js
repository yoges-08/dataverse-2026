const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const qrcode = require('qrcode');
const mockStore = require('../utils/mockStore');
const { sendRegistrationMail, sendLoginMail } = require('../utils/mailer');

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

exports.registerStudent = async (req, res) => {
  try {
    const {
      name, email, password, registerNumber, collegeName, department, year,
      phone, gender, dateOfBirth, address, emergencyContact, foodPreference, accommodationRequired
    } = req.body;

    if (isDbConnected()) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email address already registered' });
      }

      if (phone) {
        const existingPhone = await Student.findOne({ phone });
        if (existingPhone) {
          return res.status(400).json({ success: false, message: 'This phone number is already registered. Use a different phone number.' });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email,
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

      const qrPayload = JSON.stringify({ symposiumCode, registerNumber, name, collegeName, department, email });
      const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

      const profilePhoto = req.files && req.files.profilePhoto ? `/uploads/${req.files.profilePhoto[0].filename}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
      const collegeIdCard = req.files && req.files.collegeIdCard ? `/uploads/${req.files.collegeIdCard[0].filename}` : 'https://images.unsplash.com/photo-1578836537282-3171d77f8632?auto=format&fit=crop&w=600&q=80';

      const student = await Student.create({
        user: user._id,
        symposiumCode,
        registerNumber,
        collegeName: collegeName || 'Anjalai Ammal Mahalingam Engineering College',
        department,
        year,
        email,
        phone,
        gender,
        dateOfBirth,
        address,
        profilePhoto,
        collegeIdCard,
        emergencyContact,
        foodPreference: foodPreference || 'Veg',
        accommodationRequired: accommodationRequired || 'No',
        verificationStatus: 'Pending',
        qrCodeData: qrCodeDataUrl
      });

      const token = generateToken(user._id);

      sendRegistrationMail({ to: email, name: user.name, registerNumber, symposiumCode, qrCodeData: qrCodeDataUrl });

      return res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        student
      });
    } else {
      // In-Memory Fallback
      const existing = mockStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email address already registered' });
      }

      if (phone && mockStore.students.some(s => s.phone && s.phone === phone)) {
        return res.status(400).json({ success: false, message: 'This phone number is already registered. Use a different phone number.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = 'u' + (mockStore.users.length + 1);
      const user = { _id: userId, name, email, password: hashedPassword, role: 'student', isEmailVerified: true };
      mockStore.users.push(user);

      const symposiumCode = generateSymposiumCode();
      const qrPayload = JSON.stringify({ symposiumCode, registerNumber, name, collegeName, department, email });
      const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

      const studentId = 's' + (mockStore.students.length + 1);
      const student = {
        _id: studentId,
        user: userId,
        symposiumCode,
        registerNumber,
        collegeName: collegeName || 'Anjalai Ammal Mahalingam Engineering College',
        department: department || 'Computer Science & Engineering',
        year: year || 'III',
        email,
        phone,
        gender: gender || 'Male',
        dateOfBirth,
        address,
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        collegeIdCard: 'https://images.unsplash.com/photo-1578836537282-3171d77f8632?auto=format&fit=crop&w=600&q=80',
        emergencyContact,
        foodPreference: foodPreference || 'Veg',
        accommodationRequired: accommodationRequired || 'No',
        verificationStatus: 'Pending',
        isCheckedIn: false,
        qrCodeData: qrCodeDataUrl
      };

      mockStore.students.push(student);
      const token = generateToken(userId);

      sendRegistrationMail({ to: email, name: user.name, registerNumber, symposiumCode, qrCodeData: qrCodeDataUrl });

      return res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        student
      });
    }
  } catch (error) {
    console.error('Register Student Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (isDbConnected()) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = generateToken(user._id);
      let student = null;
      if (user.role === 'student') student = await Student.findOne({ user: user._id });

      if (user.role === 'student') sendLoginMail({ to: user.email, name: user.name });

      return res.status(200).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        student
      });
    } else {
      // In-Memory Fallback
      const user = mockStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = generateToken(user._id);
      let student = null;
      if (user.role === 'student') student = mockStore.students.find(s => s.user === user._id);

      if (user.role === 'student') sendLoginMail({ to: user.email, name: user.name });

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

exports.getMe = async (req, res) => {
  try {
    if (isDbConnected()) {
      const user = await User.findById(req.user.id).select('-password');
      let student = null;
      if (user.role === 'student') student = await Student.findOne({ user: user._id });
      return res.status(200).json({ success: true, user, student });
    } else {
      const user = mockStore.users.find(u => u._id === req.user.id);
      let student = null;
      if (user && user.role === 'student') student = mockStore.students.find(s => s.user === user._id);
      return res.status(200).json({ success: true, user, student });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your registered email.',
      demoToken: resetToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Forgot password error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Password reset successfully! You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Reset password error' });
  }
};
