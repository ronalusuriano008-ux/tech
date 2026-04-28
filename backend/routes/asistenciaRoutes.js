// backend/routes/asistenciaRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const asistenciaController = require('../controllers/asistenciaController');

router.use(authMiddleware);
router.get('/', asistenciaController.getAsistencia);
router.post('/check-in', asistenciaController.checkIn);
router.post('/check-out', asistenciaController.checkOut);

module.exports = router;