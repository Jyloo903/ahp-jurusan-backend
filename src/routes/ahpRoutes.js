const express = require('express');
const router = express.Router();

const ahpController = require('../controllers/ahpController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/calculate', ahpController.calculateAHP);

module.exports = router;
