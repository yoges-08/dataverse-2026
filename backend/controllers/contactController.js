const mongoose = require('mongoose');
const ContactMessage = require('../models/ContactMessage');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Kept in memory for the no-DB fallback; messages are still genuinely received
// and logged server-side, even if they cannot be persisted to MongoDB.
const inMemoryMessages = [];

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanSubject = (subject || '').trim();
    const cleanMessage = (message || '').trim();

    if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all the required fields.'
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (isDbConnected()) {
      await ContactMessage.create({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage
      });
    } else {
      inMemoryMessages.push({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
        receivedAt: new Date().toISOString()
      });
      console.log(`📬 [CONTACT] ${cleanName} <${cleanEmail}> — ${cleanSubject}`);
      console.log(`📬 ${cleanMessage}`);
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been sent to the DATAVERSE organizing committee.'
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to send your message. Please try again later.' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    if (isDbConnected()) {
      const messages = await ContactMessage.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, messages });
    }
    return res.status(200).json({ success: true, messages: inMemoryMessages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching messages' });
  }
};