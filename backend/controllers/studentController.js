const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const bcrypt = require('bcryptjs');
const qrcode = require('qrcode');
const mockStore = require('../utils/mockStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const generateSpotCode = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `DV2026-SPOT-${randomNum}`;
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (isDbConnected()) {
      const student = await Student.findOne({ user: userId });
      return res.status(200).json({ success: true, student });
    } else {
      const student = mockStore.students.find(s => s.user === userId || String(s.user) === String(userId));
      return res.status(200).json({ success: true, student });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { phone, address, emergencyContact, foodPreference, accommodationRequired } = req.body;
    if (isDbConnected()) {
      let student = await Student.findOne({ user: userId });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      student.phone = phone || student.phone;
      student.address = address || student.address;
      student.emergencyContact = emergencyContact || student.emergencyContact;
      student.foodPreference = foodPreference || student.foodPreference;
      student.accommodationRequired = accommodationRequired || student.accommodationRequired;
      if (req.files && req.files.profilePhoto) student.profilePhoto = `/uploads/${req.files.profilePhoto[0].filename}`;

      await student.save();
      return res.status(200).json({ success: true, student, message: 'Profile updated successfully' });
    } else {
      let student = mockStore.students.find(s => s.user === userId || String(s.user) === String(userId));
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      student.phone = phone || student.phone;
      student.address = address || student.address;
      student.emergencyContact = emergencyContact || student.emergencyContact;
      student.foodPreference = foodPreference || student.foodPreference;
      student.accommodationRequired = accommodationRequired || student.accommodationRequired;

      return res.status(200).json({ success: true, student, message: 'Profile updated successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};

exports.getRegisteredEvents = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (isDbConnected()) {
      const student = await Student.findOne({ user: userId });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
      const registrations = await Registration.find({ student: student._id }).populate('event');
      return res.status(200).json({ success: true, count: registrations.length, registrations });
    } else {
      const student = mockStore.students.find(s => s.user === userId || String(s.user) === String(userId));
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      const regs = mockStore.registrations.filter(r => r.student === student._id || String(r.student) === String(student._id));
      const populated = regs.map(r => {
        const ev = mockStore.events.find(e => e._id === r.event || String(e._id) === String(r.event));
        return { ...r, event: ev };
      });
      return res.status(200).json({ success: true, count: populated.length, registrations: populated });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching registered events' });
  }
};

exports.spotRegistration = async (req, res) => {
  try {
    const {
      name, email, registerNumber, collegeName, department, year, phone,
      gender, eventIds, foodPreference, accommodationRequired
    } = req.body;

    if (!name || !email || !registerNumber || !collegeName || !department) {
      return res.status(400).json({ success: false, message: 'Please fill all required spot registration fields' });
    }

    if (isDbConnected()) {
      let user = await User.findOne({ email });
      let student;
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('SpotPass2026!', salt);
        user = await User.create({ name, email, password: hashedPassword, role: 'student' });
      }

      student = await Student.findOne({ user: user._id });
      if (!student) {
        const symposiumCode = generateSpotCode();
        const qrPayload = JSON.stringify({ symposiumCode, registerNumber, name, collegeName, department, email, type: 'Spot Registration' });
        const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

        student = await Student.create({
          user: user._id,
          symposiumCode,
          registerNumber,
          collegeName,
          department,
          year: year || 'III',
          email,
          phone: phone || '9999999999',
          gender: gender || 'Other',
          verificationStatus: 'Approved',
          isCheckedIn: true,
          checkInTime: new Date(),
          checkedInBy: req.user ? req.user.name : 'Spot Counter Volunteer',
          qrCodeData: qrCodeDataUrl,
          foodPreference: foodPreference || 'Veg',
          accommodationRequired: accommodationRequired || 'No',
          isSpotRegistration: true
        });
      } else {
        student.verificationStatus = 'Approved';
        student.isCheckedIn = true;
        student.checkInTime = new Date();
        student.checkedInBy = req.user ? req.user.name : 'Spot Counter Volunteer';
        await student.save();
      }

      return res.status(201).json({
        success: true,
        message: 'Spot Registration & Check-In completed successfully!',
        student
      });
    } else {
      let user = mockStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('SpotPass2026!', salt);
        user = { _id: 'u' + (mockStore.users.length + 1), name, email, password: hashedPassword, role: 'student' };
        mockStore.users.push(user);
      }

      let student = mockStore.students.find(s => s.user === user._id || String(s.user) === String(user._id));
      if (!student) {
        const symposiumCode = generateSpotCode();
        const qrPayload = JSON.stringify({ symposiumCode, registerNumber, name, collegeName, department, email, type: 'Spot Registration' });
        const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

        student = {
          _id: 's' + (mockStore.students.length + 1),
          user: user._id,
          symposiumCode,
          registerNumber,
          collegeName,
          department,
          year: year || 'III',
          email,
          phone: phone || '9999999999',
          gender: gender || 'Male',
          profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          collegeIdCard: 'https://images.unsplash.com/photo-1578836537282-3171d77f8632?auto=format&fit=crop&w=600&q=80',
          verificationStatus: 'Approved',
          isCheckedIn: true,
          checkInTime: new Date().toISOString(),
          checkedInBy: req.user ? req.user.name : 'Spot Counter Volunteer',
          qrCodeData: qrCodeDataUrl,
          foodPreference: foodPreference || 'Veg',
          accommodationRequired: accommodationRequired || 'No',
          isSpotRegistration: true
        };
        mockStore.students.push(student);
      } else {
        student.verificationStatus = 'Approved';
        student.isCheckedIn = true;
        student.checkInTime = new Date().toISOString();
        student.checkedInBy = req.user ? req.user.name : 'Spot Counter Volunteer';
      }

      return res.status(201).json({
        success: true,
        message: 'Spot Registration & Check-In completed successfully!',
        student
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Spot registration server error' });
  }
};
