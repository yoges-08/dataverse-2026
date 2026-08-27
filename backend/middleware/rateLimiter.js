const rateLimit = require('express-rate-limit');

// Helper to format consistent rate limit error messages
const createLimiter = (options) => {
  return rateLimit({
    standardHeaders: true, // Return standard RateLimit headers (Draft-7)
    legacyHeaders: false, // Disable X-RateLimit-* headers
    handler: (req, res, next, opts) => {
      res.status(opts.statusCode || 429).json({
        success: false,
        message: typeof opts.message === 'string' ? opts.message : 'Too many requests. Please try again later.'
      });
    },
    ...options
  });
};

// Global API limiter: 300 requests per 15 minutes per IP
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP address. Please try again in 15 minutes.'
});

// Authentication limiter (Login & Register): 15 attempts per 15 minutes per IP
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many login/registration attempts. Please wait 15 minutes before trying again.'
});

// Sensitive OTP / Password reset limiter: 5 attempts per 15 minutes per IP
const passwordResetLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please wait 15 minutes before requesting again.'
});

// Contact form spam limiter: 5 messages per 15 minutes per IP
const contactLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many contact inquiries submitted. Please wait a few minutes before trying again.'
});

// Certificate generation limiter: 30 requests per minute per IP
const certGenLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many certificate generation requests. Please wait a moment.'
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  contactLimiter,
  certGenLimiter
};
