const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Student = require('../models/Student');
const mockStore = require('../utils/mockStore');
const { sendEventRegistrationMail } = require('../utils/mailer');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Normalize a phone number to a digit-only form.
const normalizePhone = (p) => String(p || '').replace(/[^0-9]/g, '');

const findByNormalizedPhone = async (phoneDigits) => {
  if (isDbConnected()) {
    const candidates = await Student.find({}, 'phone user collegeName department').populate('user', 'name').lean();
    return candidates.find((s) => normalizePhone(s.phone) === phoneDigits) || null;
  }
  return mockStore.students.find((s) => normalizePhone(s.phone) === phoneDigits) || null;
};

// 0 (or missing) means the event is solo-only - no teammates may be added.
const getEffectiveTeamLimit = (event) =>
  Number.isFinite(event && event.teamLimit) ? event.teamLimit : 0;

// A teammate must be a registered DATAVERSE student (verified by phone). The
// list is capped at the event's teamLimit (0 = solo only, teammates rejected).
const validateTeamMembers = async (teamMembers, event, teamLimit) => {
  const clean = [];
  const normalized = [];
  if (teamLimit <= 0 && (teamMembers || []).length > 0) {
    return { error: `${event.title} does not allow team members. You can register as a solo participant only.`, members: null };
  }
  for (const member of teamMembers || []) {
    const name = String(member?.name || '').trim();
    const phoneDigits = normalizePhone(member?.phone || '');
    if (!name || !phoneDigits) continue;
    if (normalized.includes(phoneDigits)) continue; // drop duplicates within the list
    const found = await findByNormalizedPhone(phoneDigits);
    if (!found) return { error: `${name} (${member?.phone}) is not registered on DATAVERSE. Only classmates who are already registered can be added as teammates.`, members: null };
    normalized.push(phoneDigits);
    clean.push({ name, phone: phoneDigits });
  }
  if (teamLimit > 0 && clean.length > teamLimit) {
    return { error: `You can add up to ${teamLimit} teammates for ${event.title}.`, members: null };
  }
  return { members: clean };
};

// Parse teamMembers sent as a multipart JSON string or a JSON array.
const parseTeamMembers = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

// Verify a classmate's phone belongs to someone registered on DATAVERSE, so
// only real registered students can be added as teammates.
exports.lookupTeammate = async (req, res) => {
  try {
    const phoneDigits = normalizePhone(req.params.phone || '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
    }
    const student = await findByNormalizedPhone(phoneDigits);
    if (!student) {
      return res.status(200).json({ success: true, found: false });
    }
    const name = student.user?.name || student.name || student.email || 'Registered Student';
    return res.status(200).json({
      success: true,
      found: true,
      student: {
        _id: student._id,
        name,
        collegeName: student.collegeName || '',
        department: student.department || '',
        phone: student.phone || phoneDigits
      }
    });
  } catch (error) {
    console.error('Teammate lookup error:', error);
    res.status(500).json({ success: false, message: 'Error verifying teammate' });
  }
};

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

// Attach full student details (register number, email, college, department,
// symposium code) to each teammate by matching their stored phone number.
const enrichTeamMembers = async (teamMembers) => {
  if (!teamMembers || teamMembers.length === 0) return teamMembers || [];
  let students;
  if (isDbConnected()) {
    students = await Student.find({}, 'phone registerNumber email collegeName department symposiumCode').populate('user', 'name').lean();
  } else {
    students = mockStore.students.map(s => {
      const u = mockStore.users.find(usr => String(usr._id) === String(s.user));
      return { ...s, user: u ? { name: u.name } : { name: s.email } };
    });
  }
  const byPhone = new Map();
  students.forEach(s => {
    const key = normalizePhone(s.phone);
    if (key) byPhone.set(key, s);
  });
  return teamMembers.map(m => {
    const st = byPhone.get(normalizePhone(m.phone));
    return {
      name: m.name,
      phone: m.phone,
      ...(st ? {
        registerNumber: st.registerNumber || '',
        email: st.email || '',
        collegeName: st.collegeName || '',
        department: st.department || '',
        symposiumCode: st.symposiumCode || ''
      } : {})
    };
  });
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
      for (const reg of registrations) {
        reg.teamMembers = await enrichTeamMembers(reg.teamMembers || []);
      }
      return res.status(200).json({ success: true, event, registrations });
    } else {
      const event = mockStore.events.find(e => e._id === req.params.id || String(e._id) === String(req.params.id));
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      const regs = mockStore.registrations.filter(r => r.event === event._id || String(r.event) === String(event._id));
      const populated = regs.map(async r => {
        const s = mockStore.students.find(st => st._id === r.student || String(st._id) === String(r.student));
        const u = s ? mockStore.users.find(usr => usr._id === s.user || String(usr._id) === String(s.user)) : null;
        const teamMembers = await enrichTeamMembers(r.teamMembers || []);
        return {
          ...r,
          teamMembers,
          student: s ? { ...s, user: u ? { name: u.name } : { name: s.email } } : null
        };
      });
      return res.status(200).json({ success: true, event, registrations: await Promise.all(populated) });
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

        // Teammates must be registered DATAVERSE students, and the total is capped by
        // teamLimit (validated server-side).
        const teamMemberResult = await validateTeamMembers(
          parseTeamMembers(req.body.teamMembers),
          event,
          getEffectiveTeamLimit(event)
        );
        if (teamMemberResult.error) {
          return res.status(400).json({ success: false, message: teamMemberResult.error });
        }
        const teamMembers = teamMemberResult.members;

        const registration = useTx
          ? (await Registration.create([{ student: student._id, event: eventId, paperPdfUrl, teamMembers }], { session }))[0]
          : await Registration.create({ student: student._id, event: eventId, paperPdfUrl, teamMembers });
        event.currentRegistrations += 1;
        if (useTx) await event.save({ session });
        else await event.save();

        if (session) await session.commitTransaction();

        // Notify the student about their new event booking.
        sendEventRegistrationMail({
          to: student.email,
          name: req.user?.name || student.email?.split('@')[0] || 'there',
          eventTitle: event.title,
          eventVenue: event.venue,
          eventDate: event.date,
          eventTime: event.time
        }).catch((mailErr) => console.error('Event registration email failed:', mailErr.message));

        return res.status(201).json({ success: true, message: `Registered for ${event.title}!`, registration });
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

      // Teammates must be registered DATAVERSE students, and the total is capped by
      // teamLimit (validated server-side).
      const teamMemberResult = await validateTeamMembers(
        parseTeamMembers(req.body.teamMembers),
        event,
        getEffectiveTeamLimit(event)
      );
      if (teamMemberResult.error) {
        return res.status(400).json({ success: false, message: teamMemberResult.error });
      }
      const teamMembers = teamMemberResult.members;

      const registration = { _id: 'r' + (mockStore.registrations.length + 1), student: student._id, event: eventId, status: 'Registered', paperPdfUrl: req.file ? `/uploads/${req.file.filename}` : null, teamMembers };
      mockStore.registrations.push(registration);
      event.currentRegistrations += 1;

      sendEventRegistrationMail({
        to: student.email,
        name: req.user?.name || student.email?.split('@')[0] || 'there',
        eventTitle: event.title,
        eventVenue: event.venue,
        eventDate: event.date,
        eventTime: event.time
      }).catch((mailErr) => console.error('Event registration email failed:', mailErr.message));

      return res.status(201).json({ success: true, message: `Registered for ${event.title}!`, registration });
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
