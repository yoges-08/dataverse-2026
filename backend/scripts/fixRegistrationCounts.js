// Recalculates Event.currentRegistrations from the actual Registration
// collection and fixes any drift. Safe to re-run any time.
//
//   node backend/scripts/fixRegistrationCounts.js
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in environment.');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const events = await Event.find().select('_id title currentRegistrations');
  const regs = await Registration.find()
    .select('event student status')
    .lean();

  // Count unique students per event, excluding cancelled registrations.
  const countByEvent = {};
  regs.forEach(r => {
    if (!r.student || r.status === 'Cancelled') return;
    const key = String(r.event);
    if (!countByEvent[key]) countByEvent[key] = new Set();
    countByEvent[key].add(String(r.student));
  });

  let fixedCount = 0;
  for (const ev of events) {
    const realCount = countByEvent[String(ev._id)]
      ? countByEvent[String(ev._id)].size
      : 0;
    if (ev.currentRegistrations !== realCount) {
      console.log(`${ev.title}: ${ev.currentRegistrations} -> ${realCount}`);
      ev.currentRegistrations = realCount;
      await ev.save();
      fixedCount += 1;
    }
  }

  console.log(
    fixedCount
      ? `\nFixed ${fixedCount} event(s).`
      : '\nAll counts already correct.'
  );
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
