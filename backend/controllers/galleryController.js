const mongoose = require('mongoose');
const Gallery = require('../models/Gallery');
const mockStore = require('../utils/mockStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getGallery = async (req, res) => {
  try {
    const { category, year } = req.query;
    if (isDbConnected()) {
      let query = {};
      if (category) query.category = category;
      if (year) query.year = year;
      const items = await Gallery.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: items.length, items });
    } else {
      let items = [...mockStore.gallery];
      if (category) items = items.filter(g => g.category === category);
      if (year) items = items.filter(g => g.year === year);
      return res.status(200).json({ success: true, count: items.length, items });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching gallery items' });
  }
};

exports.addGalleryItem = async (req, res) => {
  try {
    const { title, category, year, description } = req.body;
    let imageUrl = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;
    else if (req.body.imageUrl) imageUrl = req.body.imageUrl;

    if (isDbConnected()) {
      const item = await Gallery.create({ title, category, year: year || '2026', imageUrl, description });
      return res.status(201).json({ success: true, message: 'Gallery item added successfully', item });
    } else {
      const item = { _id: 'g' + (mockStore.gallery.length + 1), title, category: category || 'Technical', year: year || '2026', imageUrl, description };
      mockStore.gallery.unshift(item);
      return res.status(201).json({ success: true, message: 'Gallery item added successfully', item });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding gallery item' });
  }
};
