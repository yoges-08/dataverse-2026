// Read-only diagnostic: find students who appear in more than one Team for the
// same event (i.e. leftover duplicate teams). Makes NO changes to the database.
//
//   node backend/scripts/checkDuplicateTeams.js
//
// If it prints duplicates, run: node backend/scripts/fixDuplicateTeams.js
// If it prints nothing but the Admin Registrants panel still shows two teams,
// the data is clean and the issue is elsewhere (stale cache / fresh duplicate).
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

  let foundAny = false;
  for (const [eventId, eventTeams] of Object.entries(byEvent)) {
    const studentToTeams = {};
    eventTeams.forEach(t => {
      (t.members || []).forEach(m => {
        const sid = String(m.student);
        (studentToTeams[sid] = studentToTeams[sid] || []).push(t.teamId);
      });
    });
    const dupes = Object.entries(studentToTeams).filter(([, ids]) => new Set(ids).size > 1);
    if (dupes.length > 0) {
      foundAny = true;
      console.log(`Event ${eventId} has overlapping teams:`);
      dupes.forEach(([sid, teamIds]) => console.log(`  student ${sid} appears in teams: ${[...new Set(teamIds)].join(', ')}`));
    }
  }
  if (!foundAny) console.log('No duplicate/overlapping teams found in the database.');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });