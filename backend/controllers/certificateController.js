const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');
const Student = require('../models/Student');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const qrcode = require('qrcode');
const mockStore = require('../utils/mockStore');
const { sendCertificateReadyMail, sendBulkCertificatesMail } = require('../utils/mailer');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (isDbConnected()) {
      const student = await Student.findOne({ user: userId });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
      const certificates = await Certificate.find({ student: student._id })
        .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
        .populate('event', 'title category date');
      return res.status(200).json({ success: true, certificates });
    } else {
      const student = mockStore.students.find(s => s.user === userId || String(s.user) === String(userId));
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      const certs = mockStore.certificates.filter(c => c.student === student._id || String(c.student) === String(student._id)).map(c => {
        const ev = mockStore.events.find(e => e._id === c.event || String(e._id) === String(c.event));
        return { ...c, event: ev };
      });
      return res.status(200).json({ success: true, certificates: certs });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching certificates' });
  }
};

exports.getAllCertificates = async (req, res) => {
  try {
    if (isDbConnected()) {
      const certificates = await Certificate.find()
        .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
        .populate('event', 'title category')
        .sort({ issuedAt: -1 })
        .lean();
      return res.status(200).json({ success: true, count: certificates.length, certificates });
    } else {
      const certificates = mockStore.certificates
        .map((c) => {
          const s = mockStore.students.find((st) => st._id === c.student || String(st._id) === String(c.student));
          const u = s ? mockStore.users.find((usr) => usr._id === s.user || String(usr._id) === String(s.user)) : null;
          const ev = mockStore.events.find((e) => e._id === c.event || String(e._id) === String(c.event));
          return { ...c, student: s ? { ...s, user: u ? { name: u.name } : { name: s.email } } : null, event: ev };
        })
        .reverse();
      return res.status(200).json({ success: true, count: certificates.length, certificates });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching certificates' });
  }
};

exports.deleteCertificate = async (req, res) => {
  try {
    if (isDbConnected()) {
      const cert = await Certificate.findByIdAndDelete(req.params.id);
      if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
      return res.status(200).json({ success: true, message: 'Certificate deleted successfully' });
    } else {
      const idx = mockStore.certificates.findIndex((c) => c._id === req.params.id || String(c._id) === String(req.params.id));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Certificate not found' });
      mockStore.certificates.splice(idx, 1);
      return res.status(200).json({ success: true, message: 'Certificate deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting certificate' });
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
      if (cert) {
        // Update the existing certificate's type (e.g. Participation -> Winner)
        // instead of returning the stale old one.
        if (cert.type !== (type || 'Participation')) {
          cert.type = type || 'Participation';
          await cert.save();
        }
        return res.status(200).json({ success: true, certificate: cert, message: 'Certificate already exists' });
      }

      let certNo;
      let certNoExists = true;
      let certAttempts = 0;
      while (certNoExists && certAttempts < 20) {
        certNo = `CERT-DV2026-${Math.floor(100000 + Math.random() * 900000)}`;
        certNoExists = await Certificate.findOne({ certificateNo: certNo });
        certAttempts += 1;
      }
      if (certNoExists) {
        return res.status(500).json({ success: false, message: 'Unable to allocate a unique certificate number. Please try again.' });
      }

      const qrData = await qrcode.toDataURL(JSON.stringify({ certNo, name: student.user ? student.user.name : student.email, event: event.title }));

      cert = await Certificate.create({ certificateNo: certNo, student: student._id, event: event._id, type: type || 'Participation', verificationQrCode: qrData });

      // Non-blocking auto-email notification to student
      if (student.email) {
        sendCertificateReadyMail({
          to: student.email,
          name: student.user ? student.user.name : student.email,
          eventTitle: event.title,
          certificateType: type || 'Participation',
          certificateNo: certNo
        }).catch(mailErr => console.error('Certificate email send error (MongoDB):', mailErr.message));
      }

      return res.status(201).json({ success: true, message: 'Certificate generated successfully', certificate: cert });
    } else {
      const student = mockStore.students.find(s => s._id === studentId || String(s._id) === String(studentId));
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      if (!student.isCheckedIn || student.verificationStatus !== 'Approved') {
        return res.status(400).json({ success: false, message: 'Certificates can only be generated for verified and checked-in participants.' });
      }
      const event = mockStore.events.find(e => e._id === eventId || String(e._id) === String(eventId));
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

      let cert = mockStore.certificates.find(c => (c.student === student._id || String(c.student) === String(student._id)) && (c.event === event._id || String(c.event) === String(event._id)));
      if (cert) {
        if (cert.type !== (type || 'Participation')) {
          cert.type = type || 'Participation';
        }
        return res.status(200).json({ success: true, certificate: cert, message: 'Certificate already exists' });
      }

      let certNo;
      let certNoExists = true;
      let certAttempts = 0;
      while (certNoExists && certAttempts < 20) {
        certNo = `CERT-DV2026-${Math.floor(100000 + Math.random() * 900000)}`;
        certNoExists = mockStore.certificates.some(c => c.certificateNo === certNo);
        certAttempts += 1;
      }
      if (certNoExists) {
        return res.status(500).json({ success: false, message: 'Unable to allocate a unique certificate number. Please try again.' });
      }

      const qrData = await qrcode.toDataURL(JSON.stringify({ certNo, name: student.email, event: event.title }));

      cert = { _id: 'c' + (mockStore.certificates.length + 1), certificateNo: certNo, student: student._id, event: event._id, type: type || 'Participation', issuedAt: new Date().toISOString(), verificationQrCode: qrData };
      mockStore.certificates.push(cert);

      // Non-blocking auto-email notification to student
      if (student.email) {
        const studentUser = mockStore.users.find(u => u._id === student.user || String(u._id) === String(student.user));
        sendCertificateReadyMail({
          to: student.email,
          name: studentUser ? studentUser.name : student.email,
          eventTitle: event.title,
          certificateType: type || 'Participation',
          certificateNo: certNo
        }).catch(mailErr => console.error('Certificate email send error (mockStore):', mailErr.message));
      }

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
      const s = mockStore.students.find(st => st._id === cert.student || String(st._id) === String(cert.student));
      const u = s ? mockStore.users.find(usr => usr._id === s.user || String(usr._id) === String(s.user)) : null;
      const ev = mockStore.events.find(e => e._id === cert.event || String(e._id) === String(cert.event));

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

exports.generateBulkCertificates = async (req, res) => {
  try {
    let studentsProcessed = 0;
    let certificatesCreated = 0;
    let studentsSkippedNoRegistration = 0;
    let studentsSkippedAlreadyHadAllCertificates = 0;

    if (isDbConnected()) {
      // 1. Find all eligible students: isCheckedIn === true && verificationStatus === 'Approved'
      const eligibleStudents = await Student.find({
        isCheckedIn: true,
        verificationStatus: 'Approved'
      }).populate('user', 'name email');

      if (!eligibleStudents || eligibleStudents.length === 0) {
        return res.status(200).json({
          success: true,
          studentsProcessed: 0,
          certificatesCreated: 0,
          studentsSkippedNoRegistration: 0,
          studentsSkippedAlreadyHadAllCertificates: 0,
          message: 'No eligible checked-in students found.'
        });
      }

      const studentIds = eligibleStudents.map(s => s._id);

      // 2. Fetch all registrations for these students
      const registrations = await Registration.find({
        student: { $in: studentIds }
      }).populate('event', 'title category');

      // Group registrations by student ID
      const regByStudent = new Map();
      registrations.forEach(r => {
        if (!r.student || !r.event) return;
        const sId = String(r.student._id || r.student);
        if (!regByStudent.has(sId)) regByStudent.set(sId, []);
        regByStudent.get(sId).push(r);
      });

      // 3. Fetch all existing certificates for these students
      const existingCerts = await Certificate.find({
        student: { $in: studentIds }
      });
      const certKeySet = new Set(existingCerts.map(c => `${String(c.student)}_${String(c.event)}`));

      // 4. Process each student
      for (const student of eligibleStudents) {
        const sId = String(student._id);
        const studentRegs = regByStudent.get(sId) || [];

        // Rule: Skip students who have 0 registrations
        if (studentRegs.length === 0) {
          studentsSkippedNoRegistration += 1;
          continue;
        }

        const newCertsForStudent = [];

        for (const reg of studentRegs) {
          const ev = reg.event;
          if (!ev) continue;
          const key = `${sId}_${String(ev._id)}`;

          if (certKeySet.has(key)) {
            continue;
          }

          // Generate unique certificate number
          let certNo;
          let certNoExists = true;
          let certAttempts = 0;
          while (certNoExists && certAttempts < 20) {
            certNo = `CERT-DV2026-${Math.floor(100000 + Math.random() * 900000)}`;
            certNoExists = await Certificate.findOne({ certificateNo: certNo });
            certAttempts += 1;
          }
          if (certNoExists) continue;

          const studentDisplayName = student.user ? student.user.name : student.email;
          const qrData = await qrcode.toDataURL(JSON.stringify({ certNo, name: studentDisplayName, event: ev.title }));

          const newCert = await Certificate.create({
            certificateNo: certNo,
            student: student._id,
            event: ev._id,
            type: 'Participation',
            verificationQrCode: qrData
          });

          certKeySet.add(key);
          newCertsForStudent.push({
            eventTitle: ev.title,
            certificateType: 'Participation',
            certificateNo: certNo,
            certId: newCert._id
          });
        }

        if (newCertsForStudent.length > 0) {
          certificatesCreated += newCertsForStudent.length;
          studentsProcessed += 1;

          // Non-blocking single email dispatch per student with all PDF attachments
          if (student.email) {
            const studentDisplayName = student.user ? student.user.name : student.email;
            sendBulkCertificatesMail({
              to: student.email,
              name: studentDisplayName,
              certificates: newCertsForStudent
            }).catch(mailErr => console.error(`Bulk certificate email error for ${student.email}:`, mailErr.message));
          }
        } else {
          studentsSkippedAlreadyHadAllCertificates += 1;
        }
      }

      return res.status(200).json({
        success: true,
        studentsProcessed,
        certificatesCreated,
        studentsSkippedNoRegistration,
        studentsSkippedAlreadyHadAllCertificates
      });
    } else {
      // mockStore in-memory fallback
      const eligibleStudents = mockStore.students.filter(
        s => s.isCheckedIn && s.verificationStatus === 'Approved'
      );

      if (!eligibleStudents || eligibleStudents.length === 0) {
        return res.status(200).json({
          success: true,
          studentsProcessed: 0,
          certificatesCreated: 0,
          studentsSkippedNoRegistration: 0,
          studentsSkippedAlreadyHadAllCertificates: 0,
          message: 'No eligible checked-in students found.'
        });
      }

      for (const student of eligibleStudents) {
        const sId = String(student._id);
        const studentRegs = mockStore.registrations.filter(
          r => String(r.student) === sId || r.student === student._id
        );

        if (studentRegs.length === 0) {
          studentsSkippedNoRegistration += 1;
          continue;
        }

        const newCertsForStudent = [];

        for (const reg of studentRegs) {
          const ev = mockStore.events.find(
            e => String(e._id) === String(reg.event) || e._id === reg.event
          );
          if (!ev) continue;

          const alreadyExists = mockStore.certificates.some(
            c => (String(c.student) === sId || c.student === student._id) &&
                 (String(c.event) === String(ev._id) || c.event === ev._id)
          );

          if (alreadyExists) continue;

          let certNo;
          let certNoExists = true;
          let certAttempts = 0;
          while (certNoExists && certAttempts < 20) {
            certNo = `CERT-DV2026-${Math.floor(100000 + Math.random() * 900000)}`;
            certNoExists = mockStore.certificates.some(c => c.certificateNo === certNo);
            certAttempts += 1;
          }
          if (certNoExists) continue;

          const studentUser = mockStore.users.find(u => u._id === student.user || String(u._id) === String(student.user));
          const studentDisplayName = studentUser ? studentUser.name : student.email;
          const qrData = await qrcode.toDataURL(JSON.stringify({ certNo, name: studentDisplayName, event: ev.title }));

          const cert = {
            _id: 'c' + (mockStore.certificates.length + 1),
            certificateNo: certNo,
            student: student._id,
            event: ev._id,
            type: 'Participation',
            issuedAt: new Date().toISOString(),
            verificationQrCode: qrData
          };
          mockStore.certificates.push(cert);

          newCertsForStudent.push({
            eventTitle: ev.title,
            certificateType: 'Participation',
            certificateNo: certNo
          });
        }

        if (newCertsForStudent.length > 0) {
          certificatesCreated += newCertsForStudent.length;
          studentsProcessed += 1;

          if (student.email) {
            const studentUser = mockStore.users.find(u => u._id === student.user || String(u._id) === String(student.user));
            const studentDisplayName = studentUser ? studentUser.name : student.email;
            sendBulkCertificatesMail({
              to: student.email,
              name: studentDisplayName,
              certificates: newCertsForStudent
            }).catch(mailErr => console.error(`Bulk certificate email error (mockStore) for ${student.email}:`, mailErr.message));
          }
        } else {
          studentsSkippedAlreadyHadAllCertificates += 1;
        }
      }

      return res.status(200).json({
        success: true,
        studentsProcessed,
        certificatesCreated,
        studentsSkippedNoRegistration,
        studentsSkippedAlreadyHadAllCertificates
      });
    }
  } catch (error) {
    console.error('Error generating bulk certificates:', error);
    res.status(500).json({ success: false, message: 'Error generating bulk certificates: ' + error.message });
  }
};
