// One-time cleanup: merge/remove duplicate Team documents that contain the same
// students for the same event (created by the pre-transaction TOCTOU race).
// Run once against the live database, then deploy the transactional fix.
//
//   node backend/scripts/fixDuplicateTeams.js
const mongoose = require('mongoose');
const Team = require('../models/Team');
const dns = require('dns');
require('dotenv').config();

// Some LAN/corporate DNS servers refuse Node's SRV lookups (ECONNREFUSED) that
// mongodb+srv:// URIs need, while the OS resolver still works. Detect that and
// fall back to public resolvers so the script can connect.
function ensureSrvDns() {
  return new Promise(resolve => {
    const host = (process.env.MONGODB_URI || '').match(/@([^/]+)/)?.[1];
    if (!host) return resolve();
    dns.resolveSrv('_mongodb._tcp.' + host, err => {
      if (err && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND')) {
        try {
          dns.setServers(['1.1.1.1', '8.8.8.8']);
          console.warn('[dns] system resolver refused SRV lookup; using public resolvers');
        } catch (e) { /* ignore */ }
      }
      resolve();
    });
  });
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Copy backend/.env.example to backend/.env and fill it in first.');
    process.exit(1);
  }
  await ensureSrvDns();
  await mongoose.connect(uri);

  const teams = await Team.find().lean();
  const byEvent = {};
  teams.forEach(t => {
    const key = String(t.event);
    (byEvent[key] = byEvent[key] || []).push(t);
  });

  for (const eventId of Object.keys(byEvent)) {
    const eventTeams = byEvent[eventId];
    const studentToTeams = {};
    eventTeams.forEach(t => {
      (t.members || []).forEach(m => {
        const sid = String(m.student);
        (studentToTeams[sid] = studentToTeams[sid] || []).push(t._id.toString());
      });
    });

    // Find students who appear in more than one team for the same event.
    const dupeStudents = Object.entries(studentToTeams).filter(([, teamIds]) => new Set(teamIds).size > 1);
    if (dupeStudents.length === 0) continue;

    console.log(`Event ${eventId}: found overlapping teams involving`, dupeStudents.map(([sid]) => sid));

    // Group all teams that share any member together, keep the OLDEST team,
    // merge the rest into it, then delete the duplicates.
    const teamDocs = await Team.find({ event: eventId });
    const visited = new Set();
    for (const t of teamDocs) {
      if (visited.has(String(t._id))) continue;
      const memberIds = new Set((t.members || []).map(m => String(m.student)));
      const overlapping = teamDocs.filter(other =>
        String(other._id) !== String(t._id) &&
        !visited.has(String(other._id)) &&
        (other.members || []).some(m => memberIds.has(String(m.student)))
      );
      if (overlapping.length === 0) { visited.add(String(t._id)); continue; }

      // Keep the earliest-created team, merge the others into it.
      const group = [t, ...overlapping].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const keeper = group[0];
      const rest = group.slice(1);

      const seen = new Set(keeper.members.map(m => String(m.student)));
      for (const dupTeam of rest) {
        for (const m of dupTeam.members) {
          if (!seen.has(String(m.student))) {
            keeper.members.push({ student: m.student, addedAt: m.addedAt });
            seen.add(String(m.student));
          }
        }
      }
      await keeper.save();
      await Team.deleteMany({ _id: { $in: rest.map(r => r._id) } });
      console.log(`  Merged ${rest.length} duplicate team(s) into ${keeper.teamId}`);

      [keeper, ...rest].forEach(x => visited.add(String(x._id)));
    }
  }

  console.log('Done.');
  // Build the unique (event + member) index NOW that duplicates are gone.
  // A unique index cannot be created while violate rows still exist, so this
  // must run against a live DB before/with the new model — callers rely on it
  // as the final backstop against the simultaneous-create race.
  await Team.syncIndexes();
  console.log('Synced indexes (unique event+member constraint active).');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });