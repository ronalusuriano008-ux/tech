// backend/routes/servicioRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const servicioController = require('../controllers/servicioController');

router.use(authMiddleware);
router.get('/metrics', adminMiddleware, servicioController.getMetrics);
router.get('/', servicioController.getServicios);
router.post('/', servicioController.createServicio);
router.put('/:id', servicioController.updateServicio);
router.delete('/:id', servicioController.deleteServicio);

module.exports = router;