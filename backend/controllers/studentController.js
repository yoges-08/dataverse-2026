const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
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
      const teams = await Team.find({ leader: student._id });
      const byEvent = {};
      const fe = process.env.FRONTEND_URL || 'http://localhost:5173';
      teams.forEach(t => { byEvent[String(t.event)] = { editUrl: `${fe}/team/${t.editCode}`, editCode: t.editCode, teamId: t.teamId || null, status: t.status || null }; });
      const enriched = registrations.map(reg => {
        const plain = reg.toObject ? { ...reg.toObject() } : { ...reg };
        const t = byEvent[String(reg.event && reg.event._id)];
        plain.team = t || null;
        return plain;
      });
      return res.status(200).json({ success: true, count: enriched.length, registrations: enriched });
    } else {
      const student = mockStore.students.find(s => s.user === userId || String(s.user) === String(userId));
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      const regs = mockStore.registrations.filter(r => r.student === student._id || String(r.student) === String(student._id));
      const populated = regs.map(r => {
        const ev = mockStore.events.find(e => e._id === r.event || String(e._id) === String(r.event));
        const t = mockStore.teams.find(tm => String(tm.leader) === String(student._id) && String(tm.event) === String(r.event));
        return { ...r, event: ev, team: t ? { editUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/team/${t.editCode}`, teamId: t.teamId, status: t.status } : null };
      });
      return res.status(200).json({ success: true, count: populated.length, registrations: populated });
    }
  } catch (error) {
    console.error('Failed to fetch registered events with teams:', error);
    res.status(500).json({ success: false, message: 'Error fetching registered events' });
  }
};

exports.spotRegistration = async (req, res) => {
  try {
    const {
      name, email, registerNumber, collegeName, department, year, phone,
      gender, eventIds, foodPreference, accommodationRequired
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

      // Register the walk-in student for the selected events (if any)
      const registerEvents = async (regModelFind, regModelCreate, eventUpdate) => {
        for (const eventId of eventIds || []) {
          const exists = await regModelFind(eventId);
          if (exists) continue;
          await regModelCreate(eventId);
          await eventUpdate(eventId);
        }
      };
      if (Array.isArray(eventIds) && eventIds.length) {
        await registerEvents(
          (eventId) => Registration.findOne({ student: student._id, event: eventId }),
          (eventId) => Registration.create({ student: student._id, event: eventId, status: 'Registered' }),
          async (eventId) => {
            const ev = await Event.findById(eventId);
            if (ev) {
              if (ev.maxParticipants && ev.currentRegistrations >= ev.maxParticipants) return;
              ev.currentRegistrations += 1;
              await ev.save();
            }
          }
        );
      }

      return res.status(201).json({
        success: true,
        message: 'Spot Registration & Check-In completed successfully!',
        student
      });
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
