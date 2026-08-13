const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const qrcode = require('qrcode');
const XLSX = require('xlsx');
const Student = require('../models/Student');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const mockStore = require('../utils/mockStore');
const { sendApprovalMail } = require('../utils/mailer');

const isDbConnected = () => mongoose.connection.readyState === 1;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizePhone = (p) => String(p || '').replace(/[^0-9]/g, '');
const generateSymposiumCode = () => `DV2026-REG-${crypto.randomInt(100000, 1000000)}`;

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
      const regCounts = await Registration.aggregate([
        {
          $group: {
            _id: '$event',
            total: { $sum: 1 },
            teams: {
              $sum: {
                $cond: [{ $gt: [{ $size: { $ifNull: ['$teamMembers', []] } }, 0] }, 1, 0]
              }
            }
          }
        }
      ]);
      const regCountMap = {};
      regCounts.forEach(r => {
        regCountMap[String(r._id)] = { total: r.total, teams: r.teams, solo: r.total - r.teams };
      });
      const eventWiseRegistrations = events.map(e => ({
        _id: e._id,
        title: e.title,
        category: e.category,
        registrations: e.currentRegistrations,
        capacity: e.maxParticipants,
        ...(regCountMap[String(e._id)] || { total: 0, teams: 0, solo: 0 })
      }));

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

      const teamCountMap = {};
      mockStore.registrations.forEach(r => {
        const key = String(r.event);
        if (!teamCountMap[key]) teamCountMap[key] = { total: 0, teams: 0 };
        teamCountMap[key].total += 1;
        if ((r.teamMembers || []).length > 0) teamCountMap[key].teams += 1;
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
      await Registration.deleteMany({ student: student._id });
      await User.findByIdAndDelete(student.user);
      await Student.findByIdAndDelete(student._id);
      return res.status(200).json({ success: true, message: 'Student deleted successfully' });
    } else {
      const student = mockStore.students.find(s => s._id === req.params.id);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
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

// Excel columns accepted by the bulk import. Extra columns in the sheet are ignored.
const IMPORT_HEADERS = ['Name', 'Email', 'Register Number', 'College Name', 'Department', 'Year', 'Phone', 'Gender', 'Date of Birth', 'Address', 'Emergency Contact'];
const IMPORT_EXAMPLE = ['Santhosh Kumar', 'santhosh@gmail.com', '20CS123', 'Anjalai Ammal Mahalingam Engineering College, Kovilvenni', 'Artificial Intelligence & Data Science', 'III', '9876543210', 'Male', '2005-01-15', '', ''];

exports.downloadStudentTemplate = async (req, res) => {
  try {
    const ws = XLSX.utils.aoa_to_sheet([IMPORT_HEADERS, IMPORT_EXAMPLE]);
    ws['!cols'] = IMPORT_HEADERS.map(h => ({ wch: Math.max(h.length + 6, 24) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="DATAVERSE_Student_Import_Template.xlsx"');
    return res.send(buf);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ success: false, message: 'Error generating import template' });
  }
};

exports.importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx/.xls) or CSV file' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ success: false, message: 'The file has no readable sheet' });
    }
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'The file is empty or has no data rows' });
    }

    const defaultPassword = process.env.IMPORT_DEFAULT_PASSWORD || 'Dataverse@2026';
    const results = { imported: 0, skipped: [], errors: [] };
    const seenEmails = new Set();

    for (const [index, row] of rows.entries()) {
      const lineNo = index + 2; // +1 for the header row
      const name = String(row.Name || row.name || '').trim();
      const email = String(row.Email || row.email || '').toLowerCase().trim();
      const registerNumber = String(row['Register Number'] || row.registerNumber || '').trim() || 'N/A';
      const collegeName = String(row['College Name'] || row.collegeName || '').trim();
      const department = String(row.Department || row.department || '').trim();
      const year = String(row.Year || row.year || '').trim() || 'III';
      const phone = String(row.Phone || row.phone || '').trim();
      const gender = String(row.Gender || row.gender || '').trim() || 'Male';
      const dateOfBirth = String(row['Date of Birth'] || row.DOB || row.dateOfBirth || '').trim();
      const address = String(row.Address || row.address || '').trim();
      const emergencyContact = String(row['Emergency Contact'] || row.emergencyContact || '').trim();
      const phoneDigits = phone ? normalizePhone(phone) : '';

      if (!name || name === '.' || name.length < 3) {
        results.skipped.push({ lineNo, email: email || name, name, reason: 'Missing/invalid Name' });
        continue;
      }
      if (!email || !isValidEmail(email)) {
        results.skipped.push({ lineNo, email: email || name, name, reason: 'Missing/invalid Email' });
        continue;
      }
      if (!collegeName) {
        results.skipped.push({ lineNo, email, name, reason: 'Missing College Name' });
        continue;
      }
      if (seenEmails.has(email)) {
        results.skipped.push({ lineNo, email, name, reason: 'Duplicate row (email repeated in file)' });
        continue;
      }
      seenEmails.add(email);

      const createStudent = async (userId) => {
        let symposiumCode = generateSymposiumCode();
        let codeExists = isDbConnected() ? await Student.findOne({ symposiumCode }) : mockStore.students.some(s => s.symposiumCode === symposiumCode);
        let attempts = 0;
        while (codeExists && attempts < 20) {
          symposiumCode = generateSymposiumCode();
          codeExists = isDbConnected() ? await Student.findOne({ symposiumCode }) : mockStore.students.some(s => s.symposiumCode === symposiumCode);
          attempts += 1;
        }
        const qrPayload = JSON.stringify({ symposiumCode, type: 'Import' });
        const qrCodeDataUrl = isDbConnected() ? await qrcode.toDataURL(qrPayload) : 'mock-qr';
        return {
          userId,
          symposiumCode,
          registerNumber,
          collegeName,
          department,
          year,
          email,
          phone: phoneDigits || 'N/A',
          gender,
          dateOfBirth,
          address,
          emergencyContact,
          verificationStatus: 'Approved',
          foodPreference: 'N/A',
          accommodationRequired: 'N/A',
          qrCodeData: qrCodeDataUrl
        };
      };

      if (isDbConnected()) {
        try {
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            results.skipped.push({ lineNo, email, name, reason: 'Email already registered' });
            continue;
          }
          if (phoneDigits) {
            const phoneReuse = await Student.findOne({ phone: phoneDigits });
            if (phoneReuse) {
              results.skipped.push({ lineNo, email, name, reason: 'Phone number already registered' });
              continue;
            }
          }

          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(defaultPassword, salt);
          const user = await User.create({ name, email, password: hashedPassword, role: 'student', isEmailVerified: true });

          try {
            const data = await createStudent(user._id);
            await Student.create({ user: user._id, ...data });
            results.imported += 1;
          } catch (err) {
            await User.findByIdAndDelete(user._id).catch(() => {});
            throw err;
          }
        } catch (err) {
          if (/E11000|already registered/i.test(err.message || '')) {
            results.skipped.push({ lineNo, email, name, reason: 'Already registered (unique key)' });
          } else {
            console.error('Import row failed:', err.message);
            results.errors.push({ lineNo, email, name, reason: err.message });
          }
        }
      } else {
        if (mockStore.users.some(u => String(u.email).toLowerCase().trim() === email)) {
          results.skipped.push({ lineNo, email, name, reason: 'Email already registered' });
          continue;
        }
        if (phoneDigits && mockStore.students.some(s => normalizePhone(s.phone) === phoneDigits)) {
          results.skipped.push({ lineNo, email, name, reason: 'Phone number already registered' });
          continue;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);
        const userId = 'u' + (mockStore.users.length + 1);
        mockStore.users.push({ _id: userId, name, email, password: hashedPassword, role: 'student', isEmailVerified: true });
        const data = await createStudent(userId);
        mockStore.students.push({ _id: 's' + (mockStore.students.length + 1), user: userId, ...data });
        results.imported += 1;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Imported ${results.imported} student(s)`,
      ...results,
      defaultPassword,
      columns: IMPORT_HEADERS
    });
  } catch (error) {
    console.error('Import students error:', error);
    res.status(500).json({ success: false, message: 'Error importing students' });
  }
};
