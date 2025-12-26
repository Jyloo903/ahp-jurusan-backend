const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const superAdmin = require('../middleware/superAdminMiddleware');

const {
  createCriteria,
  getAllCriteria,
  getCriteriaById,
  updateCriteria,
  deleteCriteria
} = require('../controllers/criteriaController');

// PUBLIC
router.get('/', getAllCriteria);
router.get('/:id', getCriteriaById);

// SUPERADMIN ONLY
router.post('/', auth, superAdmin, createCriteria);
router.put('/:id', auth, superAdmin, updateCriteria);
router.delete('/:id', auth, superAdmin, deleteCriteria);

module.exports = router;
