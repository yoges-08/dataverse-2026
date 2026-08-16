// Cleans up Team documents that reference a deleted Student -- removes the
// orphaned member entries, reassigns leader if needed, deletes empty teams.
//
//   node backend/scripts/fixOrphanedTeamMembers.js
const mongoose = require('mongoose');
const Team = require('../models/Team');
const Student = require('../models/Student');
const Event = require('../models/Event');
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

const recomputeStatus = (team, event) => {
  const current = (team.members || []).length;
  const limit = event && Number.isFinite(event.teamLimit) ? event.teamLimit : 0;
  if (limit > 0 && current >= limit) return 'Complete';
  const deadline = event && event.registrationDeadline;
  if (deadline && new Date() > new Date(deadline)) return 'Incomplete';
  return 'Open';
};

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI is not set.'); process.exit(1); }
  await ensureSrvDns();
  await mongoose.connect(uri);

  const teams = await Team.find();
  const allStudentIds = new Set((await Student.find().select('_id').lean()).map(s => String(s._id)));

  let teamsFixed = 0, teamsDeleted = 0, membersRemoved = 0;

  for (const team of teams) {
    const before = (team.members || []).length;
    team.members = (team.members || []).filter(m => allStudentIds.has(String(m.student)));
    const removed = before - team.members.length;

    if (team.members.length === 0) {
      await Team.deleteOne({ _id: team._id });
      teamsDeleted += 1;
      membersRemoved += removed;
      console.log(`Deleted team ${team.teamId} (all members were deleted students)`);
      continue;
    }

    let changed = removed > 0;
    if (!allStudentIds.has(String(team.leader))) {
      const oldest = [...team.members].sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0))[0];
      team.leader = oldest.student;
      changed = true;
    }

    if (changed) {
      const event = await Event.findById(team.event);
      team.status = recomputeStatus(team, event);
      await team.save();
      teamsFixed += 1;
      membersRemoved += removed;
      console.log(`Fixed team ${team.teamId} — removed ${removed} orphaned member(s)`);
    }
  }

  console.log(`\nDone. Teams fixed: ${teamsFixed}, teams deleted: ${teamsDeleted}, orphaned entries removed: ${membersRemoved}`);
  await mongoose.disconnect();
}
run().catch(err => { console.error(err); process.exit(1); });