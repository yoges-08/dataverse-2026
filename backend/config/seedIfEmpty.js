const mongoose = require('mongoose');
const Event = require('./../models/Event');

module.exports = async function seedIfEmpty() {
  if (mongoose.connection.readyState !== 1) return;
  console.log('Checking if database needs initial seeding...');
  const eventCount = await Event.countDocuments();
  if (eventCount === 0) {
    console.log('Database is empty — running auto-seed (recreates events, announcements, gallery, staff accounts).');
    const seedData = require('./../seed');
    await seedData();
  } else {
    console.log('Database already has data — skipping auto-seed.');
  }
};