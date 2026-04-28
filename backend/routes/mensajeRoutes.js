// backend/routes/mensajeRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const mensajeController = require('../controllers/mensajeController');

router.use(authMiddleware);
router.get('/', adminMiddleware, mensajeController.getMensajes);
router.post('/', mensajeController.createMensaje);
router.put('/:id/leido', adminMiddleware, mensajeController.marcarLeido);

module.exports = router;