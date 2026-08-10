const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Student = require('../models/Student');
const mockStore = require('../utils/mockStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

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
      return res.status(200).json({ success: true, event, registrations });
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

const MAX_EVENT_REGISTRATIONS = 2;

exports.registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id || req.user._id;

    if (isDbConnected()) {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

      const student = await Student.findOne({ user: userId });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      const existing = await Registration.findOne({ student: student._id, event: eventId });
      if (existing) return res.status(400).json({ success: false, message: 'Already registered for this event' });

      const totalRegistrations = await Registration.countDocuments({ student: student._id });
      if (totalRegistrations >= MAX_EVENT_REGISTRATIONS) {
        return res.status(400).json({ success: false, message: `You can register for a maximum of ${MAX_EVENT_REGISTRATIONS} events only.` });
      }

      const registration = await Registration.create({ student: student._id, event: eventId });
      event.currentRegistrations += 1;
      await event.save();

      return res.status(201).json({ success: true, message: `Registered for ${event.title}!`, registration });
    } else {
      const event = mockStore.events.find(e => e._id === eventId || String(e._id) === String(eventId));
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

      const student = mockStore.students.find(s => s.user === userId || String(s.user) === String(userId));
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      const existing = mockStore.registrations.find(r => (r.student === student._id || String(r.student) === String(student._id)) && (r.event === eventId || String(r.event) === String(eventId)));
      if (existing) return res.status(400).json({ success: false, message: 'Already registered for this event' });

      const totalRegistrations = mockStore.registrations.filter(r => r.student === student._id || String(r.student) === String(student._id)).length;
      if (totalRegistrations >= MAX_EVENT_REGISTRATIONS) {
        return res.status(400).json({ success: false, message: `You can register for a maximum of ${MAX_EVENT_REGISTRATIONS} events only.` });
      }

      const registration = { _id: 'r' + (mockStore.registrations.length + 1), student: student._id, event: eventId, status: 'Registered' };
      mockStore.registrations.push(registration);
      event.currentRegistrations += 1;

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
