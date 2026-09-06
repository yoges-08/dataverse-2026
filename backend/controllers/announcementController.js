const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const mockStore = require('../utils/mockStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getAnnouncements = async (req, res) => {
  try {
    if (isDbConnected()) {
      const announcements = await Announcement.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: announcements.length, announcements });
    } else {
      return res.status(200).json({ success: true, count: mockStore.announcements.length, announcements: mockStore.announcements });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching announcements' });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, category, priority } = req.body;
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Announcement title is required' });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Announcement content is required' });
    }

    const VALID_CATEGORIES = ['Event Update', 'Venue Change', 'Schedule Change', 'Results', 'General'];
    const VALID_PRIORITIES = ['Normal', 'High', 'Urgent'];

    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'General';
    const safePriority = VALID_PRIORITIES.includes(priority) ? priority : 'Normal';
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const author = req.user ? req.user.name : 'Symposium Admin';

    if (isDbConnected()) {
      const announcement = await Announcement.create({
        title: cleanTitle,
        content: cleanContent,
        category: safeCategory,
        priority: safePriority,
        author
      });
      return res.status(201).json({ success: true, message: 'Announcement published successfully', announcement });
    } else {
      const item = {
        _id: 'an' + (mockStore.announcements.length + 1),
        title: cleanTitle,
        content: cleanContent,
        category: safeCategory,
        priority: safePriority,
        author,
        createdAt: new Date().toISOString()
      };
      mockStore.announcements.unshift(item);
      return res.status(201).json({ success: true, message: 'Announcement published successfully', announcement: item });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error publishing announcement' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    if (isDbConnected()) {
      await Announcement.findByIdAndDelete(req.params.id);
      return res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
    } else {
      mockStore.announcements = mockStore.announcements.filter(a => a._id !== req.params.id);
      return res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting announcement' });
  }
};
