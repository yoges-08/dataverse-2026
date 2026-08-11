const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dataverse_symposium';
    console.log(`Connecting to MongoDB...`);
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 30000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`MongoDB Connection Warning: ${error.message}. Operating in Hybrid/Memory Data Mode for continuous offline availability.`);
    return false;
  }
};

module.exports = connectDB;
