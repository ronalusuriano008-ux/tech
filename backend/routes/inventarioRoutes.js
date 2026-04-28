// backend/routes/inventarioRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const inventarioController = require('../controllers/inventarioController');

router.use(authMiddleware);
router.get('/', inventarioController.getInventario);
router.post('/', adminMiddleware, inventarioController.createInventario);
router.put('/:id', adminMiddleware, inventarioController.updateInventario);
router.delete('/:id', adminMiddleware, inventarioController.deleteInventario);

module.exports = router;