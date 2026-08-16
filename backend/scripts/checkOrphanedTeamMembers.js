// Read-only diagnostic: find Team documents that reference a Student id which
// no longer exists. Makes NO changes to the database.
//
//   node backend/scripts/checkOrphanedTeamMembers.js
const mongoose = require('mongoose');
const Team = require('../models/Team');
const Student = require('../models/Student');
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
  if (!uri) { console.error('MONGODB_URI is not set.'); process.exit(1); }
  await ensureSrvDns();
  await mongoose.connect(uri);

  const teams = await Team.find().lean();
  const allStudentIds = new Set((await Student.find().select('_id').lean()).map(s => String(s._id)));

  let foundAny = false;
  for (const team of teams) {
    const orphanedMembers = (team.members || []).filter(m => !allStudentIds.has(String(m.student)));
    const leaderOrphaned = !allStudentIds.has(String(team.leader));
    if (orphanedMembers.length > 0 || leaderOrphaned) {
      foundAny = true;
      console.log(`Team ${team.teamId} (event ${team.event}):`);
      if (leaderOrphaned) console.log(`  leader field points to deleted student ${team.leader}`);
      orphanedMembers.forEach(m => console.log(`  member entry points to deleted student ${m.student}`));
    }
  }
  if (!foundAny) console.log('No orphaned team-member references found. Data is clean.');
  else console.log('\nRun: node backend/scripts/fixOrphanedTeamMembers.js  to clean these up.');
  await mongoose.disconnect();
}
run().catch(err => { console.error(err); process.exit(1); });