// src/routes/recommendationRunRoutes.js
const express = require('express');
const router = express.Router();
const recommendationRunController = require('../controllers/recommendationRunController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Jalankan AHP + Simpan history
router.post('/run', recommendationRunController.runAHP);

// Lihat history milik user
router.get('/my-history', recommendationRunController.getMyHistory);

module.exports = router;
