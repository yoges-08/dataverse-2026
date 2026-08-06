const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const mockStore = require('./utils/mockStore');

dotenv.config();

const app = express();

// Body Parser Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length
  ? { origin: allowedOrigins }
  : {}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auto-persist: when MongoDB is offline (in-memory mode), save the data store
// to disk after every request so registered students survive server restarts.
app.use((req, res, next) => {
  res.on('finish', () => {
    if (mongoose.connection.readyState !== 1) {
      mockStore.persist();
    }
  });
  next();
});

// Connect to Database
connectDB();

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
  console.error('API Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 DATAVERSE Symposium Backend Server Running on Port ${PORT}`);
  console.log(`🏫 College: Anjalai Ammal Mahalingam Engineering College, Kovilvenni`);
  console.log(`=======================================================`);
});
