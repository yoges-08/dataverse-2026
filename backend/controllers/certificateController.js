const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');
const Student = require('../models/Student');
const Event = require('../models/Event');
const qrcode = require('qrcode');
const mockStore = require('../utils/mockStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getMyCertificates = async (req, res) => {
  try {
    if (isDbConnected()) {
      const student = await Student.findOne({ user: req.user.id });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
      const certificates = await Certificate.find({ student: student._id }).populate('event', 'title category date');
      return res.status(200).json({ success: true, certificates });
    } else {
      const student = mockStore.students.find(s => s.user === req.user.id);
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      const certs = mockStore.certificates.filter(c => c.student === student._id).map(c => {
        const ev = mockStore.events.find(e => e._id === c.event);
        return { ...c, event: ev };
      });
      return res.status(200).json({ success: true, certificates: certs });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching certificates' });
  }
};

exports.generateCertificate = async (req, res) => {
  try {
    const { studentId, eventId, type } = req.body;
    if (isDbConnected()) {
      const student = await Student.findById(studentId).populate('user', 'name');
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      if (!student.isCheckedIn || student.verificationStatus !== 'Approved') {
        return res.status(400).json({ success: false, message: 'Certificates can only be generated for verified and checked-in participants.' });
      }
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

      let cert = await Certificate.findOne({ student: student._id, event: event._id });
      if (cert) return res.status(200).json({ success: true, certificate: cert, message: 'Certificate already exists' });

      const certNo = `CERT-DV2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const qrData = await qrcode.toDataURL(JSON.stringify({ certNo, name: student.user.name, event: event.title }));

      cert = await Certificate.create({ certificateNo: certNo, student: student._id, event: event._id, type: type || 'Participation', verificationQrCode: qrData });
      return res.status(201).json({ success: true, message: 'Certificate generated successfully', certificate: cert });
    } else {
      const student = mockStore.students.find(s => s._id === studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      if (!student.isCheckedIn || student.verificationStatus !== 'Approved') {
        return res.status(400).json({ success: false, message: 'Certificates can only be generated for verified and checked-in participants.' });
      }
      const event = mockStore.events.find(e => e._id === eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

      let cert = mockStore.certificates.find(c => c.student === student._id && c.event === event._id);
      if (cert) return res.status(200).json({ success: true, certificate: cert, message: 'Certificate already exists' });

      const certNo = `CERT-DV2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const qrData = await qrcode.toDataURL(JSON.stringify({ certNo, name: student.email, event: event.title }));

      cert = { _id: 'c' + (mockStore.certificates.length + 1), certificateNo: certNo, student: student._id, event: event._id, type: type || 'Participation', issuedAt: new Date().toISOString(), verificationQrCode: qrData };
      mockStore.certificates.push(cert);

      return res.status(201).json({ success: true, message: 'Certificate generated successfully', certificate: cert });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating certificate' });
  }
};

exports.verifyCertificate = async (req, res) => {
  try {
    if (isDbConnected()) {
      const cert = await Certificate.findOne({ certificateNo: req.params.certNo }).populate({ path: 'student', populate: { path: 'user', select: 'name' } }).populate('event', 'title category date');
      if (!cert) return res.status(404).json({ success: false, message: 'Invalid certificate number.' });
      return res.status(200).json({ success: true, certificate: cert });
    } else {
      const cert = mockStore.certificates.find(c => c.certificateNo === req.params.certNo);
      if (!cert) return res.status(404).json({ success: false, message: 'Invalid certificate number.' });
      const s = mockStore.students.find(st => st._id === cert.student);
      const u = s ? mockStore.users.find(usr => usr._id === s.user) : null;
      const ev = mockStore.events.find(e => e._id === cert.event);

      return res.status(200).json({
        success: true,
        certificate: {
          ...cert,
          student: s ? { ...s, user: u ? { name: u.name } : { name: s.email } } : null,
          event: ev
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error verifying certificate' });
  }
};
