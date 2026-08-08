const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const mockStore = require('../utils/mockStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const protect = async (req, res, next) => {
  let token;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    
    if (isDbConnected()) {
      req.user = await User.findById(decoded.id).select('-password');
    } else {
      const u = mockStore.users.find(usr => usr._id === decoded.id || String(usr._id) === String(decoded.id));
      if (u) {
        req.user = { id: u._id, _id: u._id, name: u.name, email: u.email, role: u.role };
      }
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User profile not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token verification failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
