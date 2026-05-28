// backend/routes/reporteRoutes.js

const express = require('express');

const router = express.Router();

const { authMiddleware } =
    require('../middleware/auth');

const reporteController =
    require('../controllers/reporteController');


// ==========================================
// PROTEGER TODAS LAS RUTAS
// ==========================================
router.use(authMiddleware);


// ==========================================
// REPORTE JSON
// ==========================================
router.get(
    '/diario',
    reporteController.descargarReporteDiario
);


// ==========================================
// REPORTE JPG
// ==========================================
router.get(
    '/imagen',
    reporteController.descargarReporteImagen
);

module.exports = router;