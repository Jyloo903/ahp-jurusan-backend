const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const superAdmin = require('../middleware/superAdminMiddleware');

const {
  createAlternative,
  getAlternatives,
  getAlternativeById,
  updateAlternative,
  deleteAlternative
} = require('../controllers/alternativeController');

// PUBLIC
router.get('/', getAlternatives);
router.get('/:id', getAlternativeById);

// SUPERADMIN ONLY
router.post('/', auth, superAdmin, createAlternative);
router.put('/:id', auth, superAdmin, updateAlternative);
router.delete('/:id', auth, superAdmin, deleteAlternative);

module.exports = router;
