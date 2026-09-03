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

    if (!cleanName || cleanName === '.' || cleanName.length < 3 || !cleanEmail || !registerNumber || !collegeName || !department) {
      return res.status(400).json({ success: false, message: 'Please fill all required spot registration fields' });
    }

    if (isDbConnected()) {
      let user = await User.findOne({ email: cleanEmail });
      let student;
      // Repair any previously stored junk name (e.g. ".") from an old entry.
      if (user && (!String(user.name || '').trim() || String(user.name).trim() === '.')) {
        user.name = cleanName;
        await user.save();
      }
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(generateSpotPassword(), salt);
        user = await User.create({ name: cleanName, email: cleanEmail, password: hashedPassword, role: 'student' });
      }

      student = await Student.findOne({ user: user._id });
      if (!student) {
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

        const qrPayload = JSON.stringify({ symposiumCode, registerNumber, type: 'Spot Registration' });
        const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

        student = await Student.create({
          user: user._id,
          symposiumCode,
          registerNumber,
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
      } else {
        student.verificationStatus = 'Approved';
        student.isCheckedIn = true;
        student.checkInTime = new Date();
        student.checkedInBy = req.user ? req.user.name : 'Spot Counter Volunteer';
        await student.save();
      }

      // Register the walk-in student for the selected events (if any)
      const skippedEvents = [];
      if (Array.isArray(eventIds) && eventIds.length) {
        for (const eventId of eventIds) {
          const exists = await Registration.findOne({ student: student._id, event: eventId });
          if (exists) continue;

          const ev = await Event.findById(eventId);
          if (ev && ev.maxParticipants && ev.currentRegistrations >= ev.maxParticipants) {
            skippedEvents.push({
              eventId,
              title: ev.title || 'Event',
              reason: 'Event is full'
            });
            continue;
          }

          await Registration.create({ student: student._id, event: eventId, status: 'Registered' });
          if (ev) {
            ev.currentRegistrations = (ev.currentRegistrations || 0) + 1;
            await ev.save();
          }
        }
      }

      const responsePayload = {
        success: true,
        message: 'Spot Registration & Check-In completed successfully!',
        student
      };
      if (skippedEvents.length > 0) {
        responsePayload.skippedEvents = skippedEvents;
      }

      return res.status(201).json(responsePayload);
    } else {
      let user = mockStore.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(generateSpotPassword(), salt);
        user = { _id: 'u' + (mockStore.users.length + 1), name: cleanName, email: cleanEmail, password: hashedPassword, role: 'student' };
        mockStore.users.push(user);
      }

      let student = mockStore.students.find(s => s.user === user._id || String(s.user) === String(user._id));
      if (!student) {
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

        const qrPayload = JSON.stringify({ symposiumCode, registerNumber, type: 'Spot Registration' });
        const qrCodeDataUrl = await qrcode.toDataURL(qrPayload);

        student = {
          _id: 's' + (mockStore.students.length + 1),
          user: user._id,
          symposiumCode,
          registerNumber,
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
      } else {
        student.verificationStatus = 'Approved';
        student.isCheckedIn = true;
        student.checkInTime = new Date().toISOString();
        student.checkedInBy = req.user ? req.user.name : 'Spot Counter Volunteer';
      }

      // Register walk-in for selected events (mock branch)
      if (Array.isArray(eventIds) && eventIds.length) {
        for (const eventId of eventIds) {
          const exists = mockStore.registrations.find(r =>
            (r.student === student._id || String(r.student) === String(student._id)) &&
            (r.event === eventId || String(r.event) === String(eventId)));
          if (exists) continue;
          const ev = mockStore.events.find(e => e._id === eventId || String(e._id) === String(eventId));
          if (ev && ev.maxParticipants && ev.currentRegistrations >= ev.maxParticipants) continue;
          mockStore.registrations.push({ _id: 'r' + (mockStore.registrations.length + 1), student: student._id, event: eventId, status: 'Registered' });
          if (ev) ev.currentRegistrations = (ev.currentRegistrations || 0) + 1;
        }
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
