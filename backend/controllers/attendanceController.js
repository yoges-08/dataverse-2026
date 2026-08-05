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
          profilePhoto: student.profilePhoto,
          collegeIdCard: student.collegeIdCard,
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
          profilePhoto: student.profilePhoto,
          collegeIdCard: student.collegeIdCard,
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
