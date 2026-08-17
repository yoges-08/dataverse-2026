// Read-only diagnostic: print every student registered to an event with their
// raw collegeName, strict/core normalized forms, and a pairwise match matrix
// showing which pairs the matcher considers the same college.
//
//   node backend/scripts/debugCollegeMatch.js <eventId>
//
// Needs the same MONGODB_URI env var as the server.
const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Student = require('../models/Student');
const dns = require('dns');
const { collegesMatch, normStrict, normCore } = require('../utils/collegeMatch');
require('dotenv').config();

// Same DNS fallback as the other backend scripts: some LAN/corporate DNS
// servers refuse Node's SRV lookups (ECONNREFUSED) that mongodb+srv:// URIs
// need, while the OS resolver still works.
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
  const eventId = process.argv[2];
  if (!eventId) {
    console.error('Usage: node scripts/debugCollegeMatch.js <eventId>');
    process.exit(1);
  }
  await ensureSrvDns();
  await mongoose.connect(uri);

  const regs = await Registration.find({ event: eventId, status: { $ne: 'Cancelled' } })
    .select('student')
    .lean();
  if (!regs.length) {
    console.log(`No registrations found for event ${eventId}`);
    await mongoose.disconnect();
    return;
  }
  const studentIds = [...new Set(regs.map(r => String(r.student)))];
  const students = await Student.find({ _id: { $in: studentIds } }).lean();

  console.log(`\n==== College-name match debug for event ${eventId} (${students.length} students) ====\n`);
  students.forEach((s, i) => {
    const raw = s.collegeName || '(none)';
    console.log(`[${i}] ${s.name || s.email || s._id}`);
    console.log(`    raw:    ${JSON.stringify(raw)}`);
    console.log(`    strict: ${JSON.stringify(normStrict(raw))}`);
    console.log(`    core:   ${JSON.stringify(normCore(raw))}`);
  });

  console.log(`\n---- Pairwise matrix (x = same college, . = different) ----\n`);
  let diagPrinted = false;
  students.forEach((s, i) => {
    const row = students.map((o, j) => {
      if (i === j) return 'x';
      const rawI = s.collegeName || '';
      const rawJ = o.collegeName || '';
      return collegesMatch(rawI, rawJ) ? 'x' : '.';
    }).join(' ');
    // only print rows whose pair list differs from the identity diagonal
    const nonDiag = row.split(' ').filter((c, j) => j !== i);
    if (nonDiag.includes('x')) {
      if (!diagPrinted) {
        console.log(`      ${Array.from({ length: students.length }, (_, j) => `[${j}]`).join(' ')}`);
        diagPrinted = true;
      }
      console.log(`[${i}] ${row}   ${JSON.stringify(s.collegeName || '')}`);
    }
  });
  if (!diagPrinted) console.log('No matching college pairs — every registered student has a unique college name.');

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });