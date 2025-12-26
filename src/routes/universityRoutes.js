const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const superAdmin = require('../middleware/superAdminMiddleware');

const {
  createUniversity,
  getUniversities,
  getUniversityById,
  updateUniversity,
  deleteUniversity,
  getUniversitiesByAlternative,      // TAMBAH INI
  addAlternativeToUniversity         // TAMBAH INI
} = require('../controllers/universityController');

// PUBLIC — user bisa lihat daftar kampus
router.get('/', getUniversities);
router.get('/:id', getUniversityById);
router.get('/for-alternative/:alternative_id', getUniversitiesByAlternative); // TAMBAH INI

// SUPERADMIN ONLY — full CRUD
router.post('/', auth, superAdmin, createUniversity);
router.put('/:id', auth, superAdmin, updateUniversity);
router.delete('/:id', auth, superAdmin, deleteUniversity);
router.post('/link-alternative', auth, superAdmin, addAlternativeToUniversity); // TAMBAH INI

module.exports = router;