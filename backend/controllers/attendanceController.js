const mongoose = require('mongoose');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const mockStore = require('../utils/mockStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.verifyStudent = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Scan payload or student code is required' });

    let searchCode = code.trim();
    try {
      if (code.startsWith('{') && code.endsWith('}')) {
        const parsed = JSON.parse(code);
        searchCode = parsed.symposiumCode || parsed.registerNumber || searchCode;
      }
    } catch (e) {}

    if (isDbConnected()) {
      const student = await Student.findOne({
        $or: [
          { symposiumCode: searchCode },
          { registerNumber: searchCode },
          { email: searchCode.toLowerCase() }
        ]
      }).populate('user', 'name email');

      if (!student) {
        return res.status(404).json({ success: false, message: `No student record found for code '${searchCode}'` });
      }

      const registrations = await Registration.find({ student: student._id }).populate('event', 'title category venue date time');
      return res.status(200).json({
        success: true,
        student: {
          id: student._id,
          symposiumCode: student.symposiumCode,
          registerNumber: student.registerNumber,
          name: student.user ? student.user.name : student.email,
          collegeName: student.collegeName,
          department: student.department,
          year: student.year,
          email: student.email,
          phone: student.phone,
          verificationStatus: student.verificationStatus,
          isCheckedIn: student.isCheckedIn,
          checkInTime: student.checkInTime,
          checkedInBy: student.checkedInBy,
          foodPreference: student.foodPreference,
          accommodationRequired: student.accommodationRequired,
          qrCodeData: student.qrCodeData,
          registeredEvents: registrations.map(r => r.event)
        }
      });
    } else {
      const student = mockStore.students.find(s => 
        (s.symposiumCode && s.symposiumCode.toLowerCase() === searchCode.toLowerCase()) ||
        (s.registerNumber && s.registerNumber.toLowerCase() === searchCode.toLowerCase()) ||
        (s.email && s.email.toLowerCase() === searchCode.toLowerCase())
      );

      if (!student) {
        return res.status(404).json({ success: false, message: `No student record found for code '${searchCode}'` });
      }

      const user = mockStore.users.find(u => u._id === student.user);
      const regs = mockStore.registrations.filter(r => r.student === student._id);
      const events = regs.map(r => mockStore.events.find(e => e._id === r.event));

      return res.status(200).json({
        success: true,
        student: {
          id: student._id,
          symposiumCode: student.symposiumCode,
          registerNumber: student.registerNumber,
          name: user ? user.name : student.email,
          collegeName: student.collegeName,
          department: student.department,
          year: student.year,
          email: student.email,
          phone: student.phone,
          verificationStatus: student.verificationStatus,
          isCheckedIn: student.isCheckedIn,
          checkInTime: student.checkInTime,
          checkedInBy: student.checkedInBy,
          foodPreference: student.foodPreference,
          accommodationRequired: student.accommodationRequired,
          qrCodeData: student.qrCodeData,
          registeredEvents: events.filter(Boolean)
        }
      });
    }
  } catch (error) {
    console.error('Verify Student Error:', error.message);
    console.error(error.stack);
    res.status(500).json({ success: false, message: 'Error verifying student code' });
  }
};

exports.checkInStudent = async (req, res) => {
  try {
    const { studentId, gate, deviceInfo } = req.body;
    const volunteerName = req.user ? req.user.name : 'Karthik Subramanian (Student Vol)';

    if (isDbConnected()) {
      const student = await Student.findById(studentId).populate('user', 'name');
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      if (student.verificationStatus !== 'Approved') {
        return res.status(400).json({ success: false, message: `Cannot check in. Verification status is '${student.verificationStatus}'. Admin approval required.` });
      }

      if (student.isCheckedIn) {
        return res.status(400).json({
          success: false,
          alreadyCheckedIn: true,
          message: `Duplicate Check-In Warning: Student '${student.user ? student.user.name : student.symposiumCode}' was already checked in at ${new Date(student.checkInTime).toLocaleTimeString()} by ${student.checkedInBy || 'Volunteer'}.`
        });
      }

      student.isCheckedIn = true;
      student.checkInTime = new Date();
      student.checkedInBy = volunteerName;
      await student.save();

      const attendanceLog = await Attendance.create({
        student: student._id,
        verifiedBy: volunteerName,
        deviceInfo: deviceInfo || 'Volunteer Mobile QR Scanner',
        gate: gate || 'Main Entrance Gate A'
      });

      return res.status(200).json({ success: true, message: `Check-In Successful for ${student.user ? student.user.name : student.symposiumCode}! Access Granted.`, attendance: attendanceLog, student });
    } else {
      const student = mockStore.students.find(s => s._id === studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      if (student.verificationStatus !== 'Approved') {
        return res.status(400).json({ success: false, message: `Cannot check in. Verification status is '${student.verificationStatus}'. Admin approval required.` });
      }

      if (student.isCheckedIn) {
        const timeStr = student.checkInTime ? new Date(student.checkInTime).toLocaleTimeString() : 'Earlier';
        return res.status(400).json({
          success: false,
          alreadyCheckedIn: true,
          message: `Duplicate Check-In Warning: Student '${student.symposiumCode}' was already checked in at ${timeStr} by ${student.checkedInBy || 'Volunteer'}.`
        });
      }

      student.isCheckedIn = true;
      student.checkInTime = new Date().toISOString();
      student.checkedInBy = volunteerName;

      const log = {
        _id: 'a' + (mockStore.attendance.length + 1),
        student: student._id,
        verifiedBy: volunteerName,
        deviceInfo: deviceInfo || 'Volunteer Mobile QR Scanner',
        checkInTime: student.checkInTime,
        gate: gate || 'Main Entrance Gate A'
      };
      mockStore.attendance.push(log);

      return res.status(200).json({ success: true, message: `Check-In Successful for ${student.symposiumCode}! Access Granted.`, attendance: log, student });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during check-in' });
  }
};

exports.getAttendanceLogs = async (req, res) => {
  try {
    if (isDbConnected()) {
      const logs = await Attendance.find().populate({
        path: 'student',
        select: 'symposiumCode registerNumber collegeName department',
        populate: { path: 'user', select: 'name' }
      }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: logs.length, logs });
    } else {
      const logs = mockStore.attendance.map(a => {
        const s = mockStore.students.find(st => st._id === a.student);
        const u = s ? mockStore.users.find(usr => usr._id === s.user) : null;
        return {
          ...a,
          student: s ? { ...s, user: u ? { name: u.name } : { name: s.email } } : null
        };
      });
      return res.status(200).json({ success: true, count: logs.length, logs });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance logs' });
  }
};

exports.serveFood = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Scan payload or student code is required' });

    let searchCode = String(code).trim();
    try {
      if (searchCode.startsWith('{') && searchCode.endsWith('}')) {
        const parsed = JSON.parse(searchCode);
        searchCode = parsed.symposiumCode || parsed.registerNumber || searchCode;
      }
    } catch (e) {}

    const cleanPhoneDigits = searchCode.replace(/[^0-9]/g, '').slice(-10);

    if (isDbConnected()) {
      const orConditions = [
        { symposiumCode: searchCode },
        { registerNumber: searchCode },
        { email: searchCode.toLowerCase() }
      ];
      if (cleanPhoneDigits.length === 10) {
        orConditions.push({ phone: new RegExp(cleanPhoneDigits + '$') });
      }

      // 1. Attempt atomic find and update for approved, checked-in, not-yet-served student
      const student = await Student.findOneAndUpdate(
        {
          $or: orConditions,
          verificationStatus: 'Approved',
          isCheckedIn: true,
          isFoodServed: { $ne: true }
        },
        {
          $set: {
            isFoodServed: true,
            foodServedAt: new Date(),
            foodServedBy: req.user ? req.user.name : 'Canteen Volunteer'
          }
        },
        { new: true }
      ).populate('user', 'name email');

      if (student) {
        const studentName = student.user ? student.user.name : (student.name || student.email);
        return res.status(200).json({
          success: true,
          alreadyServed: false,
          message: `Meal Approved! 1 Veg Lunch served to ${studentName}.`,
          student: {
            id: student._id,
            name: studentName,
            symposiumCode: student.symposiumCode,
            collegeName: student.collegeName,
            department: student.department,
            isFoodServed: true,
            foodServedAt: student.foodServedAt,
            foodServedBy: student.foodServedBy
          }
        });
      }

      // 2. If atomic update returned null, diagnose exact reason with a fallback findOne
      const existingStudent = await Student.findOne({ $or: orConditions }).populate('user', 'name email');

      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: `No student record found for '${searchCode}'. Please verify at the registration desk.`
        });
      }

      const studentName = existingStudent.user ? existingStudent.user.name : (existingStudent.name || existingStudent.email);

      if (existingStudent.verificationStatus !== 'Approved') {
        return res.status(400).json({
          success: false,
          message: `Cannot serve food. Verification status is '${existingStudent.verificationStatus}'. Admin approval required.`
        });
      }

      if (!existingStudent.isCheckedIn) {
        return res.status(400).json({
          success: false,
          message: `Cannot serve food. Student has not checked in at the gate yet.`
        });
      }

      if (existingStudent.isFoodServed) {
        return res.status(400).json({
          success: false,
          alreadyServed: true,
          message: `Meal already collected! Student '${studentName}' already received their Veg lunch at ${new Date(existingStudent.foodServedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (by ${existingStudent.foodServedBy || 'Canteen Counter'}).`,
          student: {
            id: existingStudent._id,
            name: studentName,
            symposiumCode: existingStudent.symposiumCode,
            collegeName: existingStudent.collegeName,
            department: existingStudent.department,
            isFoodServed: true,
            foodServedAt: existingStudent.foodServedAt,
            foodServedBy: existingStudent.foodServedBy
          }
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Unable to process meal request. Please try again.'
      });
    } else {
      // mockStore in-memory branch
      const student = mockStore.students.find(s =>
        (s.symposiumCode && s.symposiumCode.toLowerCase() === searchCode.toLowerCase()) ||
        (s.email && s.email.toLowerCase() === searchCode.toLowerCase()) ||
        (cleanPhoneDigits.length === 10 && String(s.phone || '').replace(/[^0-9]/g, '').endsWith(cleanPhoneDigits))
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `No student record found for '${searchCode}'.`
        });
      }

      const user = mockStore.users.find(u => u._id === student.user);
      const studentName = user ? user.name : student.email;

      if (student.verificationStatus !== 'Approved') {
        return res.status(400).json({
          success: false,
          message: `Cannot serve food. Verification status is '${student.verificationStatus}'. Admin approval required.`
        });
      }

      if (!student.isCheckedIn) {
        return res.status(400).json({
          success: false,
          message: `Cannot serve food. Student has not checked in at the gate yet.`
        });
      }

      if (student.isFoodServed) {
        return res.status(400).json({
          success: false,
          alreadyServed: true,
          message: `Meal already collected! Student '${studentName}' already received their Veg lunch at ${new Date(student.foodServedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          student: {
            id: student._id,
            name: studentName,
            symposiumCode: student.symposiumCode,
            collegeName: student.collegeName,
            department: student.department,
            isFoodServed: true,
            foodServedAt: student.foodServedAt,
            foodServedBy: student.foodServedBy
          }
        });
      }

      student.isFoodServed = true;
      student.foodServedAt = new Date().toISOString();
      student.foodServedBy = req.user ? req.user.name : 'Canteen Volunteer';

      return res.status(200).json({
        success: true,
        alreadyServed: false,
        message: `Meal Approved! 1 Veg Lunch served to ${studentName}.`,
        student: {
          id: student._id,
          name: studentName,
          symposiumCode: student.symposiumCode,
          collegeName: student.collegeName,
          department: student.department,
          isFoodServed: true,
          foodServedAt: student.foodServedAt,
          foodServedBy: student.foodServedBy
        }
      });
    }
  } catch (error) {
    console.error('Serve Food Error:', error);
    res.status(500).json({ success: false, message: 'Error processing food scan' });
  }
};

exports.getFoodStats = async (req, res) => {
  try {
    if (isDbConnected()) {
      const [totalRegistered, totalServed, recentServed] = await Promise.all([
        Student.countDocuments(),
        Student.countDocuments({ isFoodServed: true }),
        Student.find({ isFoodServed: true })
          .sort({ foodServedAt: -1 })
          .limit(10)
          .populate('user', 'name')
          .select('symposiumCode collegeName department foodServedAt foodServedBy user')
      ]);

      return res.status(200).json({
        success: true,
        totalRegistered,
        totalServed,
        totalRemaining: Math.max(0, totalRegistered - totalServed),
        recentServed: recentServed.map(s => ({
          id: s._id,
          name: s.user ? s.user.name : 'Student',
          symposiumCode: s.symposiumCode,
          collegeName: s.collegeName,
          department: s.department,
          foodServedAt: s.foodServedAt,
          foodServedBy: s.foodServedBy
        }))
      });
    } else {
      const totalRegistered = mockStore.students.length;
      const served = mockStore.students.filter(s => s.isFoodServed);
      const recent = served.slice(-10).reverse().map(s => {
        const u = mockStore.users.find(user => user._id === s.user);
        return {
          id: s._id,
          name: u ? u.name : 'Student',
          symposiumCode: s.symposiumCode,
          collegeName: s.collegeName,
          department: s.department,
          foodServedAt: s.foodServedAt,
          foodServedBy: s.foodServedBy
        };
      });

      return res.status(200).json({
        success: true,
        totalRegistered,
        totalServed: served.length,
        totalRemaining: Math.max(0, totalRegistered - served.length),
        recentServed: recent
      });
    }
  } catch (error) {
    console.error('Get Food Stats Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching food stats' });
  }
};
