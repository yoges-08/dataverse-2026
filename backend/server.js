const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedIfEmpty = require('./config/seedIfEmpty');
const seedData = require('./seed');
const mongoose = require('mongoose');
const mockStore = require('./utils/mockStore');

dotenv.config();

const app = express();

// Render (and most cloud hosts) run behind a reverse proxy. Required so
// express-rate-limit correctly identifies visitors by their real IP.
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
  }
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));

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
