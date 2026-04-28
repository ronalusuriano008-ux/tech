// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(authMiddleware);
router.get('/', adminMiddleware, userController.getUsers);
router.post('/', adminMiddleware, userController.createUser);
router.put('/:id', adminMiddleware, userController.updateUser);
router.delete('/:id', adminMiddleware, userController.deleteUser);

module.exports = router;