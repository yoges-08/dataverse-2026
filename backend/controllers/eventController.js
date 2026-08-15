const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Student = require('../models/Student');
const Team = require('../models/Team');
const mockStore = require('../utils/mockStore');
const { sendEventRegistrationMail } = require('../utils/mailer');
const teamController = require('./teamController');

const getEffectiveTeamLimit = teamController.getEffectiveTeamLimit;

const isDbConnected = () => mongoose.connection.readyState === 1;

// Transactions require a replica set / Atlas dedicated tiers. If they are not
// available we fall back to the unique {student, event} index (which still
// makes the duplicate case atomic via E11000) plus the count check.
let txSupported = true;
let txProbeDone = false;

exports.getEvents = async (req, res) => {
  try {
    const { category } = req.query;
    if (isDbConnected()) {
      let query = {};
      if (category) query.category = category;
      const events = await Event.find(query).sort({ date: 1, title: 1 });
      return res.status(200).json({ success: true, count: events.length, events });
    } else {
      let list = [...mockStore.events];
      if (category) list = list.filter(e => e.category === category);
      return res.status(200).json({ success: true, count: list.length, events: list });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching events' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    if (isDbConnected()) {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      const [registrations, teams] = await Promise.all([
        Registration.find({ event: event._id }).populate({
          path: 'student',
          select: 'symposiumCode registerNumber collegeName department year email phone verificationStatus isCheckedIn',
          populate: { path: 'user', select: 'name' }
        }),
        Team.find({ event: event._id })
          .populate({ path: 'members.student', select: 'symposiumCode registerNumber collegeName department year email phone', populate: { path: 'user', select: 'name' } })
      ]);
      // Map each student (by ObjectId) to their team so registrations carry
      // live team info — the admin/coordinator dashboards read from here.
      const teamByStudent = new Map();
      teams.forEach(t => {
        const members = t.members || [];
        members.forEach(m => {
          if (m.student) teamByStudent.set(String(m.student._id || m.student), t);
        });
      });
      // Drop registrations whose linked student could not be populated
      // (deleted accounts / orphaned rows) or that appear more than once for
      // the same student, so counts and rows always match real students.
      const seenStudents = new Set();
      const enriched = registrations
        .filter(r => r.student && !seenStudents.has(String(r.student._id)))
        .map(r => {
          seenStudents.add(String(r.student._id));
          const t = teamByStudent.get(String(r.student._id));
          return {
            ...r.toObject(),
            team: t ? {
              teamId: t.teamId,
              teamSize: getEffectiveTeamLimit(event),
              memberCount: (t.members || []).length,
              members: (t.members || []).map(m => {
                const s = m.student || {};
                return {
                  studentId: String(s._id || ''),
                  name: (s.user && s.user.name) || s.name || s.email || '',
                  registerNumber: s.registerNumber || 'N/A',
                  department: s.department || '',
                  year: s.year || ''
                };
              })
            } : null
          };
        });
      return res.status(200).json({ success: true, event, registrations: enriched });
    } else {
      const event = mockStore.events.find(e => e._id === req.params.id || String(e._id) === String(req.params.id));
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      const regs = mockStore.registrations.filter(r => r.event === event._id || String(r.event) === String(event._id));
      const teams = mockStore.teams.filter(t => String(t.event) === String(event._id));
      const teamByStudent = new Map();
      teams.forEach(t => {
        (t.members || []).forEach(m => { if (m.student) teamByStudent.set(String(m.student), t); });
      });
      const populated = [];
      const seenStudents = new Set();
      regs.forEach(r => {
        const s = mockStore.students.find(st => st._id === r.student || String(st._id) === String(r.student));
        if (!s || seenStudents.has(String(s._id))) return; // skip orphaned/duplicate rows
        seenStudents.add(String(s._id));
        const u = mockStore.users.find(usr => usr._id === s.user || String(usr._id) === String(s.user));
        const t = teamByStudent.get(String(r.student));
        populated.push({
          ...r,
          student: { ...s, user: u ? { name: u.name } : { name: s.email } },
          team: t ? {
            teamId: t.teamId,
            teamSize: getEffectiveTeamLimit(event),
            memberCount: (t.members || []).length,
            members: (t.members || []).map(m => {
              const ms = mockStore.students.find(st => st._id === m.student || String(st._id) === String(m.student));
              const mu = ms ? mockStore.users.find(usr => usr._id === ms.user || String(usr._id) === String(ms.user)) : null;
              return {
                studentId: String(m.student),
                name: (mu && mu.name) || (ms && ms.name) || (ms && ms.email) || '',
                registerNumber: ms ? (ms.registerNumber || 'N/A') : 'N/A',
                department: ms ? (ms.department || '') : '',
                year: ms ? (ms.year || '') : ''
              };
            })
          } : null
        });
      });
      return res.status(200).json({ success: true, event, registrations: populated });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching event details' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const eventData = req.body;
    if (req.file) eventData.bannerImage = `/uploads/${req.file.filename}`;

    if (isDbConnected()) {
      const event = await Event.create(eventData);
      return res.status(201).json({ success: true, message: 'Event created successfully', event });
    } else {
      const newEvent = {
        _id: 'e' + (mockStore.events.length + 1),
        ...eventData,
        currentRegistrations: 0,
        bannerImage: eventData.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
      };
      mockStore.events.push(newEvent);
      return res.status(201).json({ success: true, message: 'Event created successfully', event: newEvent });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating event' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    if (isDbConnected()) {
      let event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      const updateData = { ...req.body };
      if (req.file) updateData.bannerImage = `/uploads/${req.file.filename}`;
      event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
      return res.status(200).json({ success: true, message: 'Event updated successfully', event });
    } else {
      let event = mockStore.events.find(e => e._id === req.params.id || String(e._id) === String(req.params.id));
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      Object.assign(event, req.body);
      return res.status(200).json({ success: true, message: 'Event updated successfully', event });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating event' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    if (isDbConnected()) {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      await Registration.deleteMany({ event: event._id });
      await Event.findByIdAndDelete(event._id);
      return res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } else {
      mockStore.events = mockStore.events.filter(e => e._id !== req.params.id && String(e._id) !== String(req.params.id));
      return res.status(200).json({ success: true, message: 'Event deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting event' });
  }
};

const MAX_EVENT_REGISTRATIONS = 3;

exports.registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id || req.user._id;

    if (isDbConnected()) {
      // Run the duplicate-check + insert atomically so two simultaneous
      // requests cannot both pass the check and create a duplicate or push the
      // student over the event limit. Falls back to best-effort if the server
      // does not support transactions (e.g. Atlas M0/M2 shared clusters).
      const useTx = txSupported;
      const session = useTx ? await mongoose.startSession() : null;
      try {
        if (session) session.startTransaction();
        const event = useTx
          ? await Event.findById(eventId).session(session)
          : await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        // Capacity & deadline enforcement
        if (event.maxParticipants && event.currentRegistrations >= event.maxParticipants) {
          return res.status(400).json({ success: false, message: 'This event is already full.' });
        }
        if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
          return res.status(400).json({ success: false, message: 'Registration deadline for this event has passed.' });
        }
        if (event.pdfRequired && !req.file) {
          return res.status(400).json({ success: false, message: 'This event requires a paper presentation PDF upload.' });
        }

        const student = useTx
          ? await Student.findOne({ user: userId }).session(session)
          : await Student.findOne({ user: userId });
        if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

        const existing = useTx
          ? await Registration.findOne({ student: student._id, event: eventId }).session(session)
          : await Registration.findOne({ student: student._id, event: eventId });
        if (existing) return res.status(400).json({ success: false, message: 'Already registered for this event' });

        const totalRegistrations = useTx
          ? await Registration.countDocuments({ student: student._id }).session(session)
          : await Registration.countDocuments({ student: student._id });
        if (totalRegistrations >= MAX_EVENT_REGISTRATIONS) {
          return res.status(400).json({ success: false, message: `You can register for a maximum of ${MAX_EVENT_REGISTRATIONS} events only.` });
        }

        const paperPdfUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const registration = useTx
          ? (await Registration.create([{ student: student._id, event: eventId, paperPdfUrl }], { session }))[0]
          : await Registration.create({ student: student._id, event: eventId, paperPdfUrl });
        event.currentRegistrations += 1;
        if (useTx) await event.save({ session });
        else await event.save();

        if (session) await session.commitTransaction();

        // Non-solo event: auto-place the registrant in a team as leader.
        // If team creation fails the registration still stands; students can
        // recover via auto-creation on first visit to Team Management.
        const declaredTeamSize = Number(req.body.teamSize) > 0 ? Number(req.body.teamSize) : 1;
        let teamCreated = false;
        try {
          const createdTeam = await teamController.createTeamForRegistration({ event, leaderStudent: student, declaredTeamSize });
          teamCreated = !!createdTeam;
        } catch (teamErr) {
          console.error('Team auto-creation failed (registration still saved):', teamErr.message);
        }

        // Notify the student about their new event booking.
        sendEventRegistrationMail({
          to: student.email,
          name: req.user?.name || student.email?.split('@')[0] || 'there',
          eventTitle: event.title,
          eventVenue: event.venue,
          eventDate: event.date,
          eventTime: event.time,
          teamEnabled: teamCreated
        }).catch((mailErr) => console.error('Event registration email failed:', mailErr.message));

        return res.status(201).json({
          success: true,
          message: `Registered for ${event.title}!`,
          registration
        });
      } catch (err) {
        if (session) { try { await session.abortTransaction(); } catch (e) {} }
        // Unique-index duplicate key -> the race condition's loser.
        if (err && err.code === 11000) {
          return res.status(400).json({ success: false, message: 'Already registered for this event' });
        }
        // Probe once: if transactions are unsupported, fall back to the
        // index-based path so shared Atlas tiers keep working.
        if (!txProbeDone && /transaction|replica set|not supported/i.test(err.message || '')) {
          txSupported = false;
          console.warn('MongoDB transactions not available; using index-based registration fallback.');
        }
        throw err;
      } finally {
        if (session) session.endSession();
      }
    } else {
      const event = mockStore.events.find(e => e._id === eventId || String(e._id) === String(eventId));
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

      // Capacity & deadline enforcement (mock branch)
      if (event.maxParticipants && event.currentRegistrations >= event.maxParticipants) {
        return res.status(400).json({ success: false, message: 'This event is already full.' });
      }
      if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
        return res.status(400).json({ success: false, message: 'Registration deadline for this event has passed.' });
      }
      if (event.pdfRequired && !req.file) {
        return res.status(400).json({ success: false, message: 'This event requires a paper presentation PDF upload.' });
      }

      const student = mockStore.students.find(s => s.user === userId || String(s.user) === String(userId));
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      const existing = mockStore.registrations.find(r => (r.student === student._id || String(r.student) === String(student._id)) && (r.event === eventId || String(r.event) === String(eventId)));
      if (existing) return res.status(400).json({ success: false, message: 'Already registered for this event' });

      const totalRegistrations = mockStore.registrations.filter(r => r.student === student._id || String(r.student) === String(student._id)).length;
      if (totalRegistrations >= MAX_EVENT_REGISTRATIONS) {
        return res.status(400).json({ success: false, message: `You can register for a maximum of ${MAX_EVENT_REGISTRATIONS} events only.` });
      }

      const registration = { _id: 'r' + (mockStore.registrations.length + 1), student: student._id, event: eventId, status: 'Registered', paperPdfUrl: req.file ? `/uploads/${req.file.filename}` : null };
      mockStore.registrations.push(registration);
      event.currentRegistrations += 1;

      const declaredTeamSize = Number(req.body.teamSize) > 0 ? Number(req.body.teamSize) : 1;
      let teamCreated = false;
      try {
        const createdTeam = await teamController.createTeamForRegistration({ event, leaderStudent: student, declaredTeamSize });
        teamCreated = !!createdTeam;
      } catch (teamErr) {
        console.error('Team auto-creation failed (registration still saved):', teamErr.message);
      }

      sendEventRegistrationMail({
        to: student.email,
        name: req.user?.name || student.email?.split('@')[0] || 'there',
        eventTitle: event.title,
        eventVenue: event.venue,
        eventDate: event.date,
        eventTime: event.time,
        teamEnabled: teamCreated
      }).catch((mailErr) => console.error('Event registration email failed:', mailErr.message));

      return res.status(201).json({
        success: true,
        message: `Registered for ${event.title}!`,
        registration
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error registering for event' });
  }
};

exports.uploadWinners = async (req, res) => {
  try {
    const { winners } = req.body;
    if (isDbConnected()) {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      event.winners = winners;
      event.winnersUploaded = true;
      await event.save();
      return res.status(200).json({ success: true, message: 'Winners updated successfully', event });
    } else {
      const event = mockStore.events.find(e => e._id === req.params.id || String(e._id) === String(req.params.id));
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      event.winners = winners;
      event.winnersUploaded = true;
      return res.status(200).json({ success: true, message: 'Winners updated successfully', event });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading winners' });
  }
};
