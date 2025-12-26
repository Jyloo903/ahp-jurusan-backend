// src/routes/pairwiseRoutes.js
const express = require('express');
const router = express.Router();
const pairwiseController = require('../controllers/pairwiseController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// ✅ ROUTES YANG MATCH DENGAN CONTROLLER
router.post('/', pairwiseController.savePairwiseComparisons);
router.get('/', pairwiseController.getPairwiseComparisons);
router.get('/:id', pairwiseController.getComparisonById);
router.delete('/:id', pairwiseController.deleteComparison);

module.exports = router;