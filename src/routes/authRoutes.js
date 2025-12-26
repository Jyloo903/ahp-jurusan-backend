// src/routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerLimiter, loginLimiter } = require('../middleware/rateLimitMiddleware');

// Register - dengan rate limiting ketat
router.post(
  '/register',
  registerLimiter, // Rate limit: 5 requests per 15 menit
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Nama wajib diisi')
      .isLength({ min: 3, max: 100 }).withMessage('Nama harus 3-100 karakter'),
    body('email')
      .trim()
      .isEmail().withMessage('Email tidak valid')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
      .matches(/\d/).withMessage('Password harus mengandung angka'),
  ],
  authController.register
);

// Login - dengan rate limiting sedang
router.post(
  '/login',
  loginLimiter, // Rate limit: 10 requests per 15 menit
  [
    body('email')
      .trim()
      .isEmail().withMessage('Email tidak valid')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password wajib diisi'),
  ],
  authController.login
);

module.exports = router;