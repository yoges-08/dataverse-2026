const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Student = require('../models/Student');
const mockStore = require('../utils/mockStore');
const teamController = require('./teamController');
const { sendEventRegistrationMail } = require('../utils/mailer');

const isDbConnected = () => mongoose.connection.readyState === 1;

// 0 (or missing) means the event is solo-only - no teams allowed.
const getEffectiveTeamLimit = (event) =>
  Number.isFinite(event && event.teamLimit) ? event.teamLimit : 0;

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
      const registrations = await Registration.find({ event: event._id }).populate({
        path: 'student',
        select: 'symposiumCode registerNumber collegeName department year email phone verificationStatus isCheckedIn',
        populate: { path: 'user', select: 'name' }
      });
      const enriched = await teamController.attachTeamsToRegistrations(registrations, event._id);
      return res.status(200).json({ success: true, event, registrations: enriched });
    } else {
      const event = mockStore.events.find(e => e._id === req.params.id || String(e._id) === String(req.params.id));
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      const regs = mockStore.registrations.filter(r => r.event === event._id || String(r.event) === String(event._id));
      const populated = regs.map(r => {
        const s = mockStore.students.find(st => st._id === r.student || String(st._id) === String(r.student));
        const u = s ? mockStore.users.find(usr => usr._id === s.user || String(usr._id) === String(s.user)) : null;
        return {
          ...r,
          student: s ? { ...s, user: u ? { name: u.name } : { name: s.email } } : null
        };
      });
      const enriched = await teamController.attachTeamsToRegistrations(populated, event._id);
      return res.status(200).json({ success: true, event, registrations: enriched });
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
        const teamSize = Number(req.body.teamSize) > 0 ? Number(req.body.teamSize) : 1;

        const registration = useTx
          ? (await Registration.create([{ student: student._id, event: eventId, paperPdfUrl }], { session }))[0]
          : await Registration.create({ student: student._id, event: eventId, paperPdfUrl });
        event.currentRegistrations += 1;
        if (useTx) await event.save({ session });
        else await event.save();

        if (session) await session.commitTransaction();

        // Non-solo event: create the Team (leader = creator) and email the
        // private team-management link. If team creation fails the registration
        // still stands; organizers can recover via the admin Teams panel.
        let team = null;
        if (getEffectiveTeamLimit(event) > 0) {
          team = await teamController.createTeamForRegistration({ event, leaderStudent: student, declaredTeamSize: teamSize });
        }

        // Notify the student about their new event booking.
        sendEventRegistrationMail({
          to: student.email,
          name: req.user?.name || student.email?.split('@')[0] || 'there',
          eventTitle: event.title,
          eventVenue: event.venue,
          eventDate: event.date,
          eventTime: event.time
        }).catch((mailErr) => console.error('Event registration email failed:', mailErr.message));

        if (team) {
          teamController.sendTeamLinkEmail({ student, event, team, userName: req.user?.name || student.email?.split('@')[0] || 'there' });
        }

        return res.status(201).json({
          success: true,
          message: `Registered for ${event.title}!`,
          registration,
          team: team ? await teamController.serializeTeam(team, event) : null
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

      // Non-solo event: create the Team (leader = creator) and email the
      // private team-management link.
      const teamSize = Number(req.body.teamSize) > 0 ? Number(req.body.teamSize) : 1;

      const registration = { _id: 'r' + (mockStore.registrations.length + 1), student: student._id, event: eventId, status: 'Registered', paperPdfUrl: req.file ? `/uploads/${req.file.filename}` : null };
      mockStore.registrations.push(registration);
      event.currentRegistrations += 1;

      let team = null;
      if (getEffectiveTeamLimit(event) > 0) {
        team = await teamController.createTeamForRegistration({ event, leaderStudent: student, declaredTeamSize: teamSize });
      }

      sendEventRegistrationMail({
        to: student.email,
        name: req.user?.name || student.email?.split('@')[0] || 'there',
        eventTitle: event.title,
        eventVenue: event.venue,
        eventDate: event.date,
        eventTime: event.time
      }).catch((mailErr) => console.error('Event registration email failed:', mailErr.message));

      if (team) {
        teamController.sendTeamLinkEmail({ student, event, team, userName: req.user?.name || student.email?.split('@')[0] || 'there' });
      }

      return res.status(201).json({
        success: true,
        message: `Registered for ${event.title}!`,
        registration,
        team: team ? await teamController.serializeTeam(team, event) : null
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
