// backend/routes/reporteRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const reporteController = require('../controllers/reporteController');

router.use(authMiddleware);
router.get('/diario', reporteController.descargarReporteDiario);

module.exports = router;