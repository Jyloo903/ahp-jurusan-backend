// src/middleware/rateLimitMiddleware.js
const rateLimit = require('express-rate-limit');

// Rate limiter untuk registrasi (max 5 per 15 menit per IP)
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // maksimal 5 request
  message: {
    success: false,
    message: 'Terlalu banyak percobaan registrasi. Silakan coba lagi dalam 15 menit.',
    retryAfter: '15 menit'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan registrasi. Silakan coba lagi dalam 15 menit.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) + ' menit'
    });
  }
});

// Rate limiter untuk login (max 10 per 15 menit per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // maksimal 10 request
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
    retryAfter: '15 menit'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️ Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) + ' menit'
    });
  }
});

// Rate limiter untuk API umum (max 100 per 15 menit per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // maksimal 100 request
  message: {
    success: false,
    message: 'Terlalu banyak request. Silakan coba lagi nanti.',
    retryAfter: '15 menit'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting untuk superadmin
    return req.user && req.user.role === 'superadmin';
  },
  handler: (req, res) => {
    console.log(`⚠️ API rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak request. Silakan coba lagi dalam beberapa menit.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) + ' menit'
    });
  }
});

// Rate limiter strict untuk operasi sensitif (max 3 per 5 menit)
const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 menit
  max: 3, // maksimal 3 request
  message: {
    success: false,
    message: 'Terlalu banyak percobaan. Silakan tunggu 5 menit.',
    retryAfter: '5 menit'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️ Strict rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan. Silakan tunggu 5 menit.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) + ' menit'
    });
  }
});

module.exports = {
  registerLimiter,
  loginLimiter,
  apiLimiter,
  strictLimiter
};