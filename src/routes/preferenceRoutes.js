const express = require('express');
const router = express.Router();
const preferenceController = require('../controllers/preferenceController');
const authMiddleware = require('../middleware/authMiddleware');

// Semua butuh login
router.use(authMiddleware);

// POST /api/preferences  → save preferences
router.post('/', preferenceController.savePreferences);

// GET /api/preferences   → get user preferences
router.get('/', preferenceController.getUserPreferences);

module.exports = router;
