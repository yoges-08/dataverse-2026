const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const Student = require('../models/Student');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const Team = require('../models/Team');
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
      // Count unique, live registrations (a student may only ever be on one row
      // per event). Orphaned rows (deleted students) are excluded so admin
      // counts match what the registrants list actually shows.
      const regEvents = await Registration.find().select('event student').lean();
      const studentCountMap = {};
      regEvents.forEach(r => {
        if (!r.student) return;
        const key = String(r.event);
        if (!studentCountMap[key]) studentCountMap[key] = new Set();
        studentCountMap[key].add(String(r.student));
      });
      // Real team data — a registration counts as a team if the student is on
      // a team (2+ members) for the event. Solo seats (leader alone) are solo.
      const teams = await Team.find().select('event members').lean();
      const teamStudentsByEvent = {};
      teams.forEach(t => {
        const members = t.members || [];
        if (members.length < 2) return;
        const key = String(t.event);
        if (!teamStudentsByEvent[key]) teamStudentsByEvent[key] = new Set();
        members.forEach(m => { if (m.student) teamStudentsByEvent[key].add(String(m.student)); });
      });
      const teamCountByEvent = {};
      regEvents.forEach(r => {
        if (!r.student) return;
        const key = String(r.event);
        if (!teamStudentsByEvent[key] || !teamStudentsByEvent[key].has(String(r.student))) return;
        // Track by Set so duplicate/orphan rows can never push teams > total.
        if (!teamCountByEvent[key]) teamCountByEvent[key] = new Set();
        teamCountByEvent[key].add(String(r.student));
      });
      const eventWiseRegistrations = events.map(e => {
        const teamsCount = teamCountByEvent[String(e._id)] ? teamCountByEvent[String(e._id)].size : 0;
        return {
          _id: e._id,
          title: e.title,
          category: e.category,
          registrations: e.currentRegistrations,
          capacity: e.maxParticipants,
          ...(studentCountMap[String(e._id)] ? {
            total: studentCountMap[String(e._id)].size,
            teams: teamsCount,
            solo: studentCountMap[String(e._id)].size - teamsCount
          } : { total: 0, teams: 0, solo: 0 })
        };
      });

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

      const teamStudentsByEvent = {};
      mockStore.teams.forEach(t => {
        const members = t.members || [];
        if (members.length < 2) return;
        const key = String(t.event);
        if (!teamStudentsByEvent[key]) teamStudentsByEvent[key] = new Set();
        members.forEach(m => { if (m.student) teamStudentsByEvent[key].add(String(m.student)); });
      });
      // Count unique, live students per event — orphaned registration rows
      // (deleted students) and duplicates are excluded so counts match the
      // registrants list.
      const studentSetByEvent = {};
      mockStore.registrations.forEach(r => {
        const s = mockStore.students.find(st => st._id === r.student || String(st._id) === String(r.student));
        if (!s) return;
        const key = String(r.event);
        if (!studentSetByEvent[key]) studentSetByEvent[key] = new Set();
        studentSetByEvent[key].add(String(s._id));
      });
      const teamCountMap = {};
      Object.keys(studentSetByEvent).forEach(key => {
        teamCountMap[key] = { total: studentSetByEvent[key].size, teams: 0, teamSet: null };
      });
      mockStore.registrations.forEach(r => {
        const key = String(r.event);
        const s = mockStore.students.find(st => st._id === r.student || String(st._id) === String(r.student));
        if (!s || !teamStudentsByEvent[key] || !teamStudentsByEvent[key].has(String(s._id))) return;
        if (!teamCountMap[key].teamSet) teamCountMap[key].teamSet = new Set();
        teamCountMap[key].teamSet.add(String(s._id));
      });
      Object.keys(teamCountMap).forEach(key => {
        teamCountMap[key].teams = teamCountMap[key].teamSet ? teamCountMap[key].teamSet.size : 0;
        delete teamCountMap[key].teamSet;
      });
      const eventWiseRegistrations = mockStore.events.map(e => {
        const c = teamCountMap[String(e._id)] || { total: 0, teams: 0 };
        return {
          _id: e._id,
          title: e.title,
          category: e.category,
          registrations: e.currentRegistrations,
          capacity: e.maxParticipants,
          total: c.total,
          teams: c.teams,
          solo: c.total - c.teams
        };
      });

      const collegeMap = {};
      const deptMap = {};
      mockStore.students.forEach(s => {
        if (s.collegeName) collegeMap[s.collegeName] = (collegeMap[s.collegeName] || 0) + 1;
        if (s.department) deptMap[s.department] = (deptMap[s.department] || 0) + 1;
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
          (s.symposiumCode && s.symposiumCode.toLowerCase().includes(term)) ||
          (s.registerNumber && s.registerNumber.toLowerCase().includes(term)) ||
          (s.email && s.email.toLowerCase().includes(term)) ||
          (s.collegeName && s.collegeName.toLowerCase().includes(term))
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
      if (college) list = list.filter(s => s.collegeName && s.collegeName.toLowerCase().includes(college.toLowerCase()));

      if (search) {
        const term = search.toLowerCase();
        list = list.filter(s => 
          (s.user && s.user.name && s.user.name.toLowerCase().includes(term)) ||
          (s.symposiumCode && s.symposiumCode.toLowerCase().includes(term)) ||
          (s.registerNumber && s.registerNumber.toLowerCase().includes(term)) ||
          (s.email && s.email.toLowerCase().includes(term)) ||
          (s.collegeName && s.collegeName.toLowerCase().includes(term))
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
      const student = await Student.findById(req.params.id);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      student.verificationStatus = status;
      student.rejectionReason = status === 'Rejected' ? (rejectionReason || 'Rejected by Admin') : '';
      await student.save();

      if (status === 'Approved') {
        const user = await User.findById(student.user);
        const studentName = user?.name || student.email.split('@')[0] || 'there';
        sendApprovalMail({
          to: student.email,
          name: studentName,
          registerNumber: student.registerNumber,
          symposiumCode: student.symposiumCode
        }).catch((mailErr) => console.error('Approval email failed:', mailErr.message));
      }

      return res.status(200).json({ success: true, message: `Student registration ${status.toLowerCase()} successfully`, student });
    } else {
      const student = mockStore.students.find(s => s._id === req.params.id);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      student.verificationStatus = status;
      student.rejectionReason = status === 'Rejected' ? (rejectionReason || 'Rejected by Admin') : '';

      if (status === 'Approved') {
        const mockUser = mockStore.users.find(u => u._id === student.user || String(u._id) === String(student.user));
        sendApprovalMail({
          to: student.email,
          name: mockUser?.name || student.email.split('@')[0] || 'there',
          registerNumber: student.registerNumber,
          symposiumCode: student.symposiumCode
        }).catch((mailErr) => console.error('Approval email failed:', mailErr.message));
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
      // Decrement each affected event's live counter so admin counts stay real.
      const regs = await Registration.find({ student: student._id });
      await Registration.deleteMany({ student: student._id });
      for (const reg of regs) {
        await Event.updateOne(
          { _id: reg.event, currentRegistrations: { $gt: 0 } },
          { $inc: { currentRegistrations: -1 } }
        );
      }
      await User.findByIdAndDelete(student.user);
      await Student.findByIdAndDelete(student._id);
      return res.status(200).json({ success: true, message: 'Student deleted successfully' });
    } else {
      const student = mockStore.students.find(s => s._id === req.params.id);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      // Decrement the affected events' counters before removing their registrations.
      mockStore.registrations
        .filter(r => String(r.student) === String(req.params.id))
        .forEach(r => {
          const ev = mockStore.events.find(e => e._id === r.event || String(e._id) === String(r.event));
          if (ev && ev.currentRegistrations > 0) ev.currentRegistrations -= 1;
        });
      mockStore.students = mockStore.students.filter(s => s._id !== req.params.id);
      mockStore.registrations = mockStore.registrations.filter(r => String(r.student) !== String(req.params.id));
      if (student.user) {
        mockStore.users = mockStore.users.filter(u => String(u._id) !== String(student.user));
      }
      return res.status(200).json({ success: true, message: 'Student deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting student' });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const allowedRoles = ['super_admin', 'coordinator', 'volunteer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${allowedRoles.join(', ')}` });
    }
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


// Export all registered students as an Excel (.xlsx) file
exports.exportStudentsExcel = async (req, res) => {
  try {
    let students;
    if (isDbConnected()) {
      students = await Student.find().populate('user', 'name email role').sort({ createdAt: -1 }).lean();
    } else {
      students = mockStore.students.map(s => {
        const u = mockStore.users.find(usr => String(usr._id) === String(s.user));
        return { ...s, user: u ? { name: u.name, email: u.email } : { name: s.email } };
      });
    }

    const headers = ['Symposium Code', 'Name', 'Email', 'Phone', 'Date of Birth', 'College', 'Department', 'Year', 'Register Number', 'Status', 'Checked In', 'Registered At'];
    const rows = students.map(s => {
      const rawName = String((s.user && s.user.name) || '').trim();
      const name = rawName && rawName !== '.' ? rawName : String(s.email || '');
      const createdAt = s.createdAt ? new Date(s.createdAt).toLocaleString('en-IN') : '';
      return [
        s.symposiumCode || '',
        name,
        s.email || '',
        s.phone || '',
        s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().slice(0, 10) : '',
        s.collegeName || '',
        s.department || '',
        s.year || '',
        s.registerNumber || '',
        s.verificationStatus || '',
        s.isCheckedIn ? 'Yes' : 'No',
        createdAt
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="DATAVERSE_Student_Registrations_${Date.now()}.xlsx"`);
    return res.send(buf);
  } catch (error) {
    console.error('Export students error:', error);
    return res.status(500).json({ success: false, message: 'Error exporting students' });
  }
};

