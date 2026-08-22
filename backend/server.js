const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedIfEmpty = require('./config/seedIfEmpty');
const seedData = require('./seed');
const Event = require('./models/Event');
const mongoose = require('mongoose');
const mockStore = require('./utils/mockStore');

dotenv.config();

const app = express();

app.use(compression());

// Render (and most cloud hosts) run behind a reverse proxy, so enable trust
// proxy to read visitors' real IP addresses.
app.set('trust proxy', 1);

// Body Parser Middleware
// CORS is restricted to an explicit allowlist (env `CORS_ORIGINS` overrides the
// defaults) instead of a wildcard, so a compromised third-party page can never
// make credentialed calls against this API.
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'https://dataverse-2026-qhyb.vercel.app'
];
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .concat(DEFAULT_CORS_ORIGINS);
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / non-browser requests with no Origin header.
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auto-persist: when MongoDB is offline (in-memory mode), save the data store
// to disk after mutating requests so registered students survive restarts.
// Persisting on every request (including reads) wasted disk I/O; only writes
// can change the in-memory store, and a short debounce coalesces bursts.
let persistTimer = null;
const persistSoon = () => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (mongoose.connection.readyState !== 1) {
      mockStore.persist();
    }
  }, 500);
};
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', persistSoon);
  }
  next();
});

// Connect to Database
connectDB().then(async (connected) => {
  if (connected) {
    try {
      // Apply Admin/Coordinator/Volunteer name+password from env vars every boot,
      // so the organizer can change credentials without editing code.
      if (seedData.syncStaffAccounts) {
        await seedData.syncStaffAccounts();
      }
    } catch (err) {
      console.error('Staff-sync failed (continuing startup):', err.message);
    }
    try {
      await seedIfEmpty();
    } catch (err) {
      console.error('Auto-seed failed (continuing startup):', err.message);
    }
    try {
      await syncEventTeamLimits();
    } catch (err) {
      console.error('Event-team-limit sync failed (continuing startup):', err.message);
    }
  }
});

// Idempotent migration: apply the scheduled teamLimit for each event by title
// so existing databases get the per-event limits without manual edits.
const EVENT_TEAM_LIMITS = [
  { title: 'Agentic AI', teamLimit: 4 },
  { title: 'NovaSpeak', teamLimit: 4 },
  { title: 'Knowledge Knockout', teamLimit: 0 },
  { title: 'Bug Hunt', teamLimit: 2 },
  { title: 'Code Sprint', teamLimit: 0 },
  { title: 'Layman Vibes', teamLimit: 3 },
  { title: 'Luminas Fest', teamLimit: 2 },
  { title: 'Viral Vision', teamLimit: 8 }
];

const syncDefaultEvents = async () => {
  if (mongoose.connection.readyState !== 1) return;
  const newEvents = [
    {
      title: 'Bug Hunt',
      category: 'Technical',
      tagline: 'Find Fast. Fix Smart. Win Big!',
      description: 'A fun coding challenge where participants must find, fix and defeat bugs! Tackle syntax, logical, runtime, and complex interconnected bugs across multiple debugging rounds.',
      rules: [
        'Team participation limit: 2 members.',
        '• Round 1 – Bug Basics: Find and fix simple syntax & logical errors.',
        '• Round 2 – Bug breaker: Hunt and fix multiple hidden bugs including syntax, logic & runtime errors. Each bug = Points.',
        '• Round 3 – Debugging Battle: Solve a complex program with interconnected bugs and pass all test cases.',
        'Participants must debug the given programs only.',
        'No internet or external help during the event.',
        'Each round must be completed within the given time limit.',
        'Bugs must be identified and fixed correctly.',
        'Points will be awarded for every correctly fixed bug.',
        'In the final round, speed + accuracy + test cases passed will decide the winner.',
        'Any form of malpractice will lead to disqualification.',
        'Judges\' decision will be final and binding.',
        'Find Fast. Fix Smart. Win Big!'
      ],
      venue: 'CC2 Lab',
      date: '2026-09-12',
      time: '',
      registrationDeadline: '2026-09-11',
      maxParticipants: 60,
      currentRegistrations: 0,
      teamLimit: 2,
      requiresLanguageChoice: true,
      facultyCoordinator: { name: '', phone: '' },
      studentCoordinator: { name: 'Student Coordinator', phone: '' },
      prizes: { first: '₹6,000 + Trophy & Certificate', second: '₹3,500 + Trophy & Certificate', third: '₹2,000 + Certificate' },
      bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Code Sprint',
      category: 'Technical',
      tagline: 'Reconstruct code, arrange scrambled programs, and solve coding challenges',
      description: 'Participants will reconstruct code, arrange scrambled programs, and tackle selected coding problems. Each round tests logical thinking, coding skills, and problem-solving ability.',
      rules: [
        'No Team participation only solo performance.',
        'The event consists of 3 rounds.',
        'Time Limit: 15 minutes for each round.',
        'Participants must submit working and error-free solutions within the given time.',
        'Scoring: Points are awarded based on correctness, completion and difficulty level.',
        'Malpractice is strictly prohibited.'
      ],
      venue: 'CC1 Lab',
      date: '2026-09-12',
      time: '',
      registrationDeadline: '2026-09-11',
      maxParticipants: 60,
      currentRegistrations: 0,
      teamLimit: 0,
      facultyCoordinator: { name: '', phone: '' },
      studentCoordinator: { name: 'Student Coordinator', phone: '' },
      prizes: { first: '₹6,000 + Trophy & Certificate', second: '₹3,500 + Trophy & Certificate', third: '₹2,000 + Certificate' },
      bannerImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80'
    }
  ];

  for (const ev of newEvents) {
    const exists = await Event.findOne({ title: { $regex: new RegExp(`^${ev.title}$`, 'i') } });
    if (!exists) {
      await Event.create(ev);
      console.log(`Created default event: ${ev.title}`);
    }
  }
};

const syncEventTeamLimits = async () => {
  if (mongoose.connection.readyState !== 1) return 0;
  await syncDefaultEvents();
  // Ensure Bug Hunt has requiresLanguageChoice flag set in existing databases
  await Event.updateMany(
    { title: { $regex: /^Bug Hunt$/i } },
    { $set: { requiresLanguageChoice: true } }
  );
  let updated = 0;
  for (const spec of EVENT_TEAM_LIMITS) {
    const result = await Event.updateMany(
      { title: { $regex: new RegExp(spec.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
      { $set: { teamLimit: spec.teamLimit } }
    );
    updated += (result.modifiedCount || 0) + (result.upsertedCount || 0);
  }
  if (updated > 0) console.log(`Applied event team limits to ${updated} event(s).`);
  return updated;
};

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    symposium: 'DATAVERSE 2026',
    college: 'Anjalai Ammal Mahalingam Engineering College, Kovilvenni',
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Not allowed by CORS' });
  }
  console.error('API Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : (err.message || 'Internal Server Error')
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 DATAVERSE Symposium Backend Server Running on Port ${PORT}`);
  console.log(`🏫 College: Anjalai Ammal Mahalingam Engineering College, Kovilvenni`);
  console.log(`=======================================================`);
});
