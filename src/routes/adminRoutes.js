const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');

// semua route butuh autentikasi
router.use(authMiddleware);

// ---- routes yang boleh diakses oleh admin (read-only) dan superadmin ----
router.get('/stats', adminMiddleware, adminController.getSystemStats);
router.get('/users/results', adminMiddleware, adminController.getUserResults);
router.get('/user/:id/history', adminMiddleware, adminController.getUserHistory);

// ---- routes yang hanya boleh diakses superadmin (CRUD penuh) ----
router.get('/users', superAdminMiddleware, adminController.getAllUsers);
router.put('/users/:id/role', superAdminMiddleware, adminController.updateUserRole);
router.delete('/users/:id', superAdminMiddleware, adminController.deleteUser);

module.exports = router;