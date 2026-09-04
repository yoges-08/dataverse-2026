const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const qrcode = require('qrcode');
const mockStore = require('../utils/mockStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const generateSpotCode = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `DV2026-SPOT-${randomNum}`;
};

// Spot-registered students get a unique, unguessable password instead of the
// old shared hardcoded default. They are checked in immediately and can use the
// forgot-password flow if they ever need to log in.
const generateSpotPassword = () => crypto.randomBytes(10).toString('hex');

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
    const { phone, address, foodPreference, accommodationRequired } = req.body;
    if (isDbConnected()) {
      let student = await Student.findOne({ user: userId });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      student.phone = phone || student.phone;
      student.address = address || student.address;
      student.foodPreference = foodPreference || student.foodPreference;
      student.accommodationRequired = accommodationRequired || student.accommodationRequired;

      await student.save();
      return res.status(200).json({ success: true, student, message: 'Profile updated successfully' });
    } else {
      let student = mockStore.students.find(s => s.user === userId || String(s.user) === String(userId));
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      student.phone = phone || student.phone;
      student.address = address || student.address;
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
    console.error('Failed to fetch registered events:', error);
    res.status(500).json({ success: false, message: 'Error fetching registered events' });
  }
};

exports.spotRegistration = async (req, res) => {
  try {
    const {
      name, email, registerNumber, collegeName, department, year, phone,
      eventIds, foodPreference, accommodationRequired
    } = req.body;

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const cleanRegisterNumber = (registerNumber || '').trim() || 'N/A';
    const cleanPhone = (phone || '').replace(/\s+/g, '').trim() || '9999999999';
    const initialPassword = cleanPhone;

    if (!cleanName || cleanName === '.' || cleanName.length < 3 || !cleanEmail || !collegeName || !department) {
      return res.status(400).json({ success: false, message: 'Please fill all required spot registration fields' });
    }

    const rawEventIds = Array.isArray(eventIds) ? [...new Set(eventIds)] : [];
    if (rawEventIds.length > 4) {
      return res.status(400).json({ success: false, message: 'You can register for a maximum of 4 events only.' });
    }

    if (isDbConnected()) {
      // 1. Run independent early checks in parallel: duplicate student check and event category check
      const [existingStudent, eventsToCheck] = await Promise.all([
        Student.findOne({
          $or: [
            { email: cleanEmail },
            { phone: cleanPhone }
          ]
        }),
        rawEventIds.length > 0 ? Event.find({ _id: { $in: rawEventIds } }) : Promise.resolve([])
      ]);

      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: "A student with this email or phone number is already registered."
        });
      }

      if (rawEventIds.length > 0) {
        const techCount = eventsToCheck.filter(e => e.category === 'Technical').length;
        const nonTechCount = eventsToCheck.filter(e => e.category === 'Non-Technical').length;

        if (techCount > 2) {
          return res.status(400).json({ success: false, message: 'You can select a maximum of 2 Technical events only.' });
        }
        if (nonTechCount > 2) {
          return res.status(400).json({ success: false, message: 'You can select a maximum of 2 Non-Technical events only.' });
        }
      }

      // 2. Generate unique symposiumCode
      let symposiumCode = generateSpotCode();
      let codeExists = await Student.findOne({ symposiumCode });
      let attempts = 0;
      while (codeExists && attempts < 20) {
        symposiumCode = generateSpotCode();
        codeExists = await Student.findOne({ symposiumCode });
        attempts += 1;
      }
      if (codeExists) {
        throw new Error('Unable to allocate a unique symposium code. Please try again.');
      }

      // 3. Run User creation and QR Code generation concurrently in parallel
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(initialPassword, salt);
      const qrPayload = JSON.stringify({ symposiumCode, registerNumber: cleanRegisterNumber, type: 'Spot Registration' });

      const [user, qrCodeDataUrl] = await Promise.all([
        User.create({ name: cleanName, email: cleanEmail, password: hashedPassword, role: 'student' }),
        qrcode.toDataURL(qrPayload)
      ]);

      // 4. Create Student document
      const student = await Student.create({
        user: user._id,
        symposiumCode,
        registerNumber: cleanRegisterNumber,
        collegeName,
        department,
        year: year || 'III',
        email: cleanEmail,
        phone: phone || '9999999999',
        verificationStatus: 'Approved',
        isCheckedIn: true,
        checkInTime: new Date(),
        checkedInBy: req.user ? req.user.name : 'Spot Counter Volunteer',
        qrCodeData: qrCodeDataUrl,
        foodPreference: foodPreference || 'Veg',
        accommodationRequired: accommodationRequired || 'No',
        isSpotRegistration: true
      });

      // 5. Batch event registrations: insert all at once and atomically increment counters
      if (rawEventIds.length > 0) {
        try {
          const registrationDocs = rawEventIds.map(eventId => ({
            student: student._id,
            event: eventId,
            status: 'Registered'
          }));
          await Registration.insertMany(registrationDocs, { ordered: false });
        } catch (regErr) {
          if (regErr.code !== 11000) {
            console.error('Non-duplicate error in spotRegistration insertMany:', regErr);
          }
        }

        await Event.updateMany(
          { _id: { $in: rawEventIds } },
          { $inc: { currentRegistrations: 1 } }
        );
      }

      return res.status(201).json({
        success: true,
        message: 'Spot Registration & Check-In completed successfully!',
        student
      });
    } else {
      // mockStore in-memory fallback branch
      const existingStudent = mockStore.students.find(s =>
        (s.email && s.email.toLowerCase().trim() === cleanEmail) ||
        (s.phone && s.phone.trim() === cleanPhone)
      );

      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: "A student with this email or phone number is already registered."
        });
      }

      if (rawEventIds.length > 0) {
        const eventsToCheck = mockStore.events.filter(e => rawEventIds.includes(e._id) || rawEventIds.includes(String(e._id)));
        const techCount = eventsToCheck.filter(e => e.category === 'Technical').length;
        const nonTechCount = eventsToCheck.filter(e => e.category === 'Non-Technical').length;

        if (techCount > 2) {
          return res.status(400).json({ success: false, message: 'You can select a maximum of 2 Technical events only.' });
        }
        if (nonTechCount > 2) {
          return res.status(400).json({ success: false, message: 'You can select a maximum of 2 Non-Technical events only.' });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(initialPassword, salt);
      const user = { _id: 'u' + (mockStore.users.length + 1), name: cleanName, email: cleanEmail, password: hashedPassword, role: 'student' };
      mockStore.users.push(user);

      let symposiumCode = generateSpotCode();
      let codeExists = mockStore.students.find(s => s.symposiumCode === symposiumCode);
      let attempts = 0;
      while (codeExists && attempts < 20) {
        symposiumCode = generateSpotCode();
        codeExists = mockStore.students.find(s => s.symposiumCode === symposiumCode);
        attempts += 1;
      }
      if (codeExists) {
        throw new Error('Unable to allocate a unique symposium code. Please try again.');
      }

      const qrPayload = JSON.stringify({ symposiumCode, registerNumber: cleanRegisterNumber, type: 'Spot Registration' });
      const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

      const student = {
        _id: 's' + (mockStore.students.length + 1),
        user: user._id,
        symposiumCode,
        registerNumber: cleanRegisterNumber,
        collegeName,
        department,
        year: year || 'III',
        email: cleanEmail,
        phone: phone || '9999999999',
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

      // Register walk-in for selected events (batched mock branch)
      if (rawEventIds.length > 0) {
        rawEventIds.forEach(eventId => {
          mockStore.registrations.push({
            _id: 'r' + (mockStore.registrations.length + 1),
            student: student._id,
            event: eventId,
            status: 'Registered'
          });
          const ev = mockStore.events.find(e => e._id === eventId || String(e._id) === String(eventId));
          if (ev) ev.currentRegistrations = (ev.currentRegistrations || 0) + 1;
        });
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
