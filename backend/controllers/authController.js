const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const qrcode = require('qrcode');
const mockStore = require('../utils/mockStore');
const sendEmail = require('../utils/sendEmail');
const { sendRegistrationMail } = require('../utils/mailer');
const { isHostCollege } = require('../utils/collegeMatch');

const isDbConnected = () => mongoose.connection.readyState === 1;

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '30d'
  });
};

// Hard-fail on missing JWT_SECRET instead of silently falling back to a
// hardcoded key that attackers can use to forge tokens.
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
};

const generateSymposiumCode = () => {
  const randomNum = crypto.randomInt(100000, 1000000);
  return `DV2026-REG-${randomNum}`;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => phone === 'N/A' || /^[0-9+\-\s]{7,15}$/.test(phone);
const normalizePhone = (p) => String(p || '').replace(/[^0-9]/g, '');

// @desc    Register a new Student
// @route   POST /api/auth/register-student
exports.registerStudent = async (req, res) => {
  let createdUser = null;
  try {
    const {
      name, email, password, collegeName, department, year,
      phone, address
    } = req.body;

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    if (!cleanEmail || !password || !cleanName || cleanName === '.' || cleanName.length < 3 || !collegeName) {
      return res.status(400).json({ success: false, message: 'Please fill all required registration fields' });
    }

    // Server-side input validation (the frontend also validates, but the API
    // must never trust client checks).
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
    }
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number' });
    }

    if (isHostCollege(collegeName)) {
      return res.status(400).json({
        success: false,
        message: 'Registration slots for this college are full.'
      });
    }

    if (isDbConnected()) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        // Only treat as an orphan (crashed registration) if it is a STUDENT-role
        // user with no student profile. Staff accounts (admin/coordinator/volunteer)
        // must NEVER be deleted or reused by a student registration.
        if (existingUser.role === 'student') {
          const existingStudent = await Student.findOne({ user: existingUser._id });
          if (!existingStudent) {
            await User.findByIdAndDelete(existingUser._id);
          } else {
            return res.status(400).json({ success: false, message: 'Email address already registered' });
          }
        } else {
          return res.status(400).json({ success: false, message: 'Email address already registered' });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      createdUser = await User.create({
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: 'student',
        isEmailVerified: true
      });

      // A phone number must not be reused by another registered student.
      const phoneDigits = normalizePhone(phone);
      if (phoneDigits) {
        const phoneReuse = await Student.findOne({ phone: phoneDigits });
        if (phoneReuse) {
          await User.findByIdAndDelete(createdUser._id).catch(() => {});
          createdUser = null;
          return res.status(400).json({ success: false, message: 'This phone number is already registered' });
        }
      }

      let symposiumCode = generateSymposiumCode();
      let codeExists = await Student.findOne({ symposiumCode });
      let attempts = 0;
      while (codeExists && attempts < 20) {
        symposiumCode = generateSymposiumCode();
        codeExists = await Student.findOne({ symposiumCode });
        attempts += 1;
      }
      if (codeExists) {
        throw new Error('Unable to allocate a unique symposium code. Please try again.');
      }

      // QR payload intentionally excludes PII (name, college, email, etc.) so
      // a captured QR cannot leak personal data; it only carries the unique code.
      const qrPayload = JSON.stringify({ symposiumCode, type: 'Registration' });
      const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

      const student = await Student.create({
        user: createdUser._id,
        symposiumCode,
        registerNumber: 'N/A',
        collegeName,
        department: department || 'Computer Science & Engineering',
        year: year || 'III',
        email: cleanEmail,
        phone: phoneDigits || 'N/A',
        address: address || '',
        foodPreference: 'N/A',
        accommodationRequired: 'N/A',
        verificationStatus: 'Pending',
        qrCodeData: qrCodeDataUrl
      });

      const token = generateToken(createdUser._id);

      const emailResult = await sendRegistrationMail({
        to: cleanEmail,
        name: cleanName,
        registerNumber: student.registerNumber,
        symposiumCode,
        qrCodeData: symposiumCode
      });

      return res.status(201).json({
        success: true,
        token,
        user: { id: createdUser._id, name: createdUser.name, email: createdUser.email, role: createdUser.role },
        student,
        emailStatus: emailResult
      });
    } else {
      // In-Memory Fallback
      const existing = mockStore.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
      if (existing) {
        // Same safety rule as DB branch: only orphaned STUDENT users may be removed.
        if (existing.role === 'student') {
          const existingStudent = mockStore.students.find(s => String(s.user) === String(existing._id));
          if (!existingStudent) {
            mockStore.users = mockStore.users.filter(u => String(u._id) !== String(existing._id));
          } else {
            return res.status(400).json({ success: false, message: 'Email address already registered' });
          }
        } else {
          return res.status(400).json({ success: false, message: 'Email address already registered' });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = 'u' + (mockStore.users.length + 1);
      const user = { _id: userId, name: cleanName, email: cleanEmail, password: hashedPassword, role: 'student', isEmailVerified: true };
      mockStore.users.push(user);

      // A phone number must not be reused by another registered student.
      const phoneDigits = normalizePhone(phone);
      if (phoneDigits && mockStore.students.some(s => normalizePhone(s.phone) === phoneDigits)) {
        mockStore.users = mockStore.users.filter(u => String(u._id) !== String(userId));
        return res.status(400).json({ success: false, message: 'This phone number is already registered' });
      }

      let symposiumCode = generateSymposiumCode();
      let codeExists = mockStore.students.find(s => s.symposiumCode === symposiumCode);
      let attempts = 0;
      while (codeExists && attempts < 20) {
        symposiumCode = generateSymposiumCode();
        codeExists = mockStore.students.find(s => s.symposiumCode === symposiumCode);
        attempts += 1;
      }
      if (codeExists) {
        throw new Error('Unable to allocate a unique symposium code. Please try again.');
      }

      const qrPayload = JSON.stringify({ symposiumCode, type: 'Registration' });
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
        phone: phoneDigits || 'N/A',
        address: address || '',
        foodPreference: 'N/A',
        accommodationRequired: 'N/A',
        verificationStatus: 'Pending',
        isCheckedIn: false,
        qrCodeData: qrCodeDataUrl
      };

      mockStore.students.push(student);
      const token = generateToken(userId);

      const emailResult = await sendRegistrationMail({
        to: cleanEmail,
        name: cleanName,
        registerNumber: student.registerNumber,
        symposiumCode,
        qrCodeData: symposiumCode
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
    // Cleanup created user if student creation failed
    if (createdUser && isDbConnected()) {
      await User.findByIdAndDelete(createdUser._id).catch(() => {});
    }
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

// @desc    Universal Login (Student, Admin, Coordinator, Volunteer)
// @route   POST /api/auth/login
// Accepts email OR username as the identifier (staff members can use either).
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    }

    if (isDbConnected()) {
      const user = await User.findOne({
        $or: [{ email: cleanEmail }, { username: cleanEmail }]
      });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = generateToken(user._id);
      let student = null;
      if (user.role === 'student') student = await Student.findOne({ user: user._id });

      if (user.role === 'student') {
        // Fire-and-forget so a slow email provider never delays login.
      }

      return res.status(200).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role },
        student
      });
    } else {
      const user = mockStore.users.find(u =>
        u.email.toLowerCase().trim() === cleanEmail ||
        (u.username && u.username.toLowerCase().trim() === cleanEmail)
      );
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = generateToken(user._id);
      let student = null;
      if (user.role === 'student') student = mockStore.students.find(s => s.user === user._id || String(s.user) === String(user._id));

      if (user.role === 'student') {
        // Fire-and-forget so a slow email provider never delays login.
      }

      return res.status(200).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role },
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

    const resetToken = crypto.randomInt(100000, 1000000).toString();
    const resetExpire = Date.now() + 15 * 60 * 1000;

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (user) {
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = resetExpire;
        await user.save();
      } else {
        // Return the same generic response for unknown emails too, so the
        // endpoint cannot be used to enumerate registered accounts.
        return res.status(200).json({
          success: true,
          message: 'If that email is registered, a password reset code has been sent.'
        });
      }
    } else {
      const user = mockStore.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
      if (user) {
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = resetExpire;
      } else {
        return res.status(200).json({
          success: true,
          message: 'If that email is registered, a password reset code has been sent.'
        });
      }
    }

    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: 'DATAVERSE 2026 - Password Reset Verification Code',
      html: `<h3>Password Reset Request</h3><p>Your 6-digit password reset OTP is: <strong style="font-size: 20px; color: #4f46e5;">${resetToken}</strong></p><p>This OTP will expire in 15 minutes.</p>`
    });

    res.status(200).json({
      success: true,
      message: emailResult && emailResult.delivered
        ? 'Password reset OTP has been sent to your email.'
        : 'Password reset OTP generated but the email could not be delivered right now. Contact the symposium desk.',
      emailStatus: emailResult,
      devOtp: process.env.SHOW_DEV_OTP === 'true' ? resetToken : undefined
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
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
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
