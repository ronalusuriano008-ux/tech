// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(authMiddleware);

// Pública para cualquier usuario autenticado (técnicos la necesitan para el chat)
router.get('/admin-info', userController.getAdminInfo);

// Restringidas solo a ADMIN
router.get('/', adminMiddleware, userController.getUsers);
router.post('/', adminMiddleware, userController.createUser);
router.put('/:id', adminMiddleware, userController.updateUser);
router.delete('/:id', adminMiddleware, userController.deleteUser);

module.exports = router;