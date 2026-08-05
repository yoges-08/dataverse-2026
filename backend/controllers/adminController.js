const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const bcrypt = require('bcryptjs');
const mockStore = require('../utils/mockStore');
const { sendApprovalMail } = require('../utils/mailer');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getAnalytics = async (req, res) => {
  try {
    if (isDbConnected()) {
      const totalStudents = await Student.countDocuments();
      const pendingStudents = await Student.countDocuments({ verificationStatus: 'Pending' });
      const approvedStudents = await Student.countDocuments({ verificationStatus: 'Approved' });
      const rejectedStudents = await Student.countDocuments({ verificationStatus: 'Rejected' });
      const checkedInCount = await Student.countDocuments({ isCheckedIn: true });
      const certificatesCount = await Certificate.countDocuments();
      const technicalEvents = await Event.countDocuments({ category: 'Technical' });
      const nonTechnicalEvents = await Event.countDocuments({ category: 'Non-Technical' });

      const events = await Event.find().select('title category currentRegistrations maxParticipants');
      const eventWiseRegistrations = events.map(e => ({ title: e.title, category: e.category, registrations: e.currentRegistrations, capacity: e.maxParticipants }));

      const collegeWiseStats = await Student.aggregate([{ $group: { _id: '$collegeName', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);
      const deptWiseStats = await Student.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);

      return res.status(200).json({
        success: true,
        stats: { totalStudents, pendingStudents, approvedStudents, rejectedStudents, checkedInCount, certificatesCount, technicalEvents, nonTechnicalEvents, attendancePercentage: totalStudents > 0 ? Math.round((checkedInCount / totalStudents) * 100) : 0 },
        charts: { eventWiseRegistrations, collegeWiseStats: collegeWiseStats.map(c => ({ college: c._id || 'Unknown', count: c.count })), deptWiseStats: deptWiseStats.map(d => ({ department: d._id || 'Unknown', count: d.count })) }
      });
    } else {
      const totalStudents = mockStore.students.length;
      const pendingStudents = mockStore.students.filter(s => s.verificationStatus === 'Pending').length;
      const approvedStudents = mockStore.students.filter(s => s.verificationStatus === 'Approved').length;
      const rejectedStudents = mockStore.students.filter(s => s.verificationStatus === 'Rejected').length;
      const checkedInCount = mockStore.students.filter(s => s.isCheckedIn).length;
      const certificatesCount = mockStore.certificates.length;
      const technicalEvents = mockStore.events.filter(e => e.category === 'Technical').length;
      const nonTechnicalEvents = mockStore.events.filter(e => e.category === 'Non-Technical').length;

      const eventWiseRegistrations = mockStore.events.map(e => ({ title: e.title, category: e.category, registrations: e.currentRegistrations, capacity: e.maxParticipants }));

      const collegeMap = {};
      const deptMap = {};
      mockStore.students.forEach(s => {
        collegeMap[s.collegeName] = (collegeMap[s.collegeName] || 0) + 1;
        deptMap[s.department] = (deptMap[s.department] || 0) + 1;
      });

      return res.status(200).json({
        success: true,
        stats: { totalStudents, pendingStudents, approvedStudents, rejectedStudents, checkedInCount, certificatesCount, technicalEvents, nonTechnicalEvents, attendancePercentage: totalStudents > 0 ? Math.round((checkedInCount / totalStudents) * 100) : 0 },
        charts: {
          eventWiseRegistrations,
          collegeWiseStats: Object.keys(collegeMap).map(c => ({ college: c, count: collegeMap[c] })),
          deptWiseStats: Object.keys(deptMap).map(d => ({ department: d, count: deptMap[d] }))
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading analytics' });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const { search, status, department, college } = req.query;

    if (isDbConnected()) {
      let query = {};
      if (status) query.verificationStatus = status;
      if (department) query.department = department;
      if (college) query.collegeName = { $regex: college, $options: 'i' };

      let students = await Student.find(query).populate('user', 'name email role').sort({ createdAt: -1 });

      if (search) {
        const term = search.toLowerCase();
        students = students.filter(s => 
          (s.user && s.user.name && s.user.name.toLowerCase().includes(term)) ||
          s.symposiumCode.toLowerCase().includes(term) ||
          s.registerNumber.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          s.collegeName.toLowerCase().includes(term)
        );
      }
      return res.status(200).json({ success: true, count: students.length, students });
    } else {
      let list = mockStore.students.map(s => {
        const u = mockStore.users.find(usr => usr._id === s.user);
        return { ...s, user: u ? { name: u.name, email: u.email, role: u.role } : { name: s.email } };
      });

      if (status) list = list.filter(s => s.verificationStatus === status);
      if (department) list = list.filter(s => s.department === department);
      if (college) list = list.filter(s => s.collegeName.toLowerCase().includes(college.toLowerCase()));

      if (search) {
        const term = search.toLowerCase();
        list = list.filter(s => 
          (s.user && s.user.name && s.user.name.toLowerCase().includes(term)) ||
          s.symposiumCode.toLowerCase().includes(term) ||
          s.registerNumber.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          s.collegeName.toLowerCase().includes(term)
        );
      }

      return res.status(200).json({ success: true, count: list.length, students: list });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching students' });
  }
};

exports.updateStudentStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (isDbConnected()) {
      const student = await Student.findById(req.params.id).populate('user', 'name');
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      student.verificationStatus = status;
      student.rejectionReason = status === 'Rejected' ? (rejectionReason || 'Rejected by Admin') : '';
      await student.save();

      if (status === 'Approved') {
        const studentName = student.user ? student.user.name : student.email;
        sendApprovalMail({ to: student.email, name: studentName, registerNumber: student.registerNumber, symposiumCode: student.symposiumCode, qrCodeData: student.qrCodeData });
      }

      return res.status(200).json({ success: true, message: `Student registration ${status.toLowerCase()} successfully`, student });
    } else {
      const student = mockStore.students.find(s => s._id === req.params.id);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      student.verificationStatus = status;
      student.rejectionReason = status === 'Rejected' ? (rejectionReason || 'Rejected by Admin') : '';

      if (status === 'Approved') {
        const u = mockStore.users.find(usr => usr._id === student.user);
        sendApprovalMail({ to: student.email, name: u ? u.name : student.email, registerNumber: student.registerNumber, symposiumCode: student.symposiumCode, qrCodeData: student.qrCodeData });
      }

      return res.status(200).json({ success: true, message: `Student registration ${status.toLowerCase()} successfully`, student });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating student status' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    if (isDbConnected()) {
      const student = await Student.findById(req.params.id);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      await Registration.deleteMany({ student: student._id });
      await User.findByIdAndDelete(student.user);
      await Student.findByIdAndDelete(student._id);
      return res.status(200).json({ success: true, message: 'Student deleted successfully' });
    } else {
      mockStore.students = mockStore.students.filter(s => s._id !== req.params.id);
      return res.status(200).json({ success: true, message: 'Student deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting student' });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (isDbConnected()) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = await User.create({ name, email, password: hashedPassword, role });
      return res.status(201).json({ success: true, message: `${role.toUpperCase()} account created`, user });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = { _id: 'u' + (mockStore.users.length + 1), name, email, password: hashedPassword, role };
      mockStore.users.push(user);
      return res.status(201).json({ success: true, message: `${role.toUpperCase()} account created`, user });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating staff' });
  }
};

exports.getStaffList = async (req, res) => {
  try {
    if (isDbConnected()) {
      const staff = await User.find({ role: { $in: ['coordinator', 'volunteer', 'super_admin'] } }).select('-password');
      return res.status(200).json({ success: true, count: staff.length, staff });
    } else {
      const staff = mockStore.users.filter(u => ['coordinator', 'volunteer', 'super_admin'].includes(u.role));
      return res.status(200).json({ success: true, count: staff.length, staff });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing staff' });
  }
};
