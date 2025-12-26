// src/routes/alternativeComparisonRoutes.js
const express = require('express');
const router = express.Router();
const alternativeComparisonController = require('../controllers/alternativeComparisonController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/save', alternativeComparisonController.saveAlternativeComparisons);
router.get('/my-comparisons', alternativeComparisonController.getUserAlternativeComparisons);

module.exports = router;