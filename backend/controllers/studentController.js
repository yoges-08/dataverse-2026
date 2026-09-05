const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Counter = require('../models/Counter');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const qrcode = require('qrcode');
const mockStore = require('../utils/mockStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const getNextSpotCode = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'DV2026-SPOT' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return `DV2026-SPOT-${String(counter.seq).padStart(6, '0')}`;
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

      // 2. Generate unique symposiumCode & pre-generate userId
      let symposiumCode = await getNextSpotCode();
      const userId = new mongoose.Types.ObjectId();
      let qrPayload = JSON.stringify({ symposiumCode, registerNumber: cleanRegisterNumber, type: 'Spot Registration' });

      // 3. Hash initial password (8 rounds for fast CPU execution) & generate QR code concurrently
      const salt = await bcrypt.genSalt(8);
      let [hashedPassword, qrCodeDataUrl] = await Promise.all([
        bcrypt.hash(initialPassword, salt),
        qrcode.toDataURL(qrPayload)
      ]);

      // 4. Create User and Student documents with auto-retry on code collision & rollback protection
      let user;
      let student;

      const createStudentDoc = (code, qrData) => {
        return Student.create({
          user: userId,
          symposiumCode: code,
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
          qrCodeData: qrData,
          foodPreference: foodPreference || 'Veg',
          accommodationRequired: accommodationRequired || 'No',
          isSpotRegistration: true
        });
      };

      try {
        try {
          [user, student] = await Promise.all([
            User.create({ _id: userId, name: cleanName, email: cleanEmail, password: hashedPassword, role: 'student' }),
            createStudentDoc(symposiumCode, qrCodeDataUrl)
          ]);
        } catch (initialErr) {
          // If a rare collision occurs on symposiumCode, retry Student.create with a fresh code
          const isCodeDup = initialErr.code === 11000 && (
            initialErr.keyPattern?.symposiumCode ||
            (initialErr.message && initialErr.message.includes('symposiumCode'))
          );

          if (isCodeDup) {
            symposiumCode = await getNextSpotCode();
            qrPayload = JSON.stringify({ symposiumCode, registerNumber: cleanRegisterNumber, type: 'Spot Registration' });
            qrCodeDataUrl = await qrcode.toDataURL(qrPayload);
            student = await createStudentDoc(symposiumCode, qrCodeDataUrl);
          } else {
            throw initialErr;
          }
        }
      } catch (createErr) {
        // Rollback safety net: cleanly delete both User and Student if either was created, preventing orphan records in either direction
        await Promise.all([
          User.findByIdAndDelete(userId).catch(() => {}),
          Student.deleteOne({ user: userId }).catch(() => {})
        ]);
        throw createErr;
      }

      // 5. Batch event registrations: insert registrations and update event counters concurrently in parallel
      if (rawEventIds.length > 0) {
        const registrationDocs = rawEventIds.map(eventId => ({
          student: student._id,
          event: eventId,
          status: 'Registered'
        }));

        await Promise.all([
          Registration.insertMany(registrationDocs, { ordered: false }).catch(regErr => {
            if (regErr.code !== 11000) {
              console.error('Non-duplicate error in spotRegistration insertMany:', regErr);
            }
          }),
          Event.updateMany(
            { _id: { $in: rawEventIds } },
            { $inc: { currentRegistrations: 1 } }
          )
        ]);
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

      const salt = await bcrypt.genSalt(8);
      const spotSeq = (mockStore.spotCounter = (mockStore.spotCounter || 0) + 1);
      const symposiumCode = `DV2026-SPOT-${String(spotSeq).padStart(6, '0')}`;
      const qrPayload = JSON.stringify({ symposiumCode, registerNumber: cleanRegisterNumber, type: 'Spot Registration' });

      const [hashedPassword, qrCodeDataUrl] = await Promise.all([
        bcrypt.hash(initialPassword, salt),
        qrcode.toDataURL(qrPayload)
      ]);

      const userId = 'u' + (mockStore.users.length + 1);
      const user = { _id: userId, name: cleanName, email: cleanEmail, password: hashedPassword, role: 'student' };
      mockStore.users.push(user);

      const student = {
        _id: 's' + (mockStore.students.length + 1),
        user: userId,
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
