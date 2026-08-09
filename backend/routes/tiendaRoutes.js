const express = require('express');
const router = express.Router();

const tiendaController = require('../controllers/tiendaController');

router.get('/month/:year/:month', tiendaController.getMonth);

router.post('/day/:year/:month', tiendaController.createDay);

router.delete('/day/:year/:month/:day', tiendaController.deleteDay);

router.post('/month/:year/:month/recalculate', tiendaController.recalculate);

// PDF (server-side)
router.get('/pdf/:year/:month', tiendaController.pdfMonth);

module.exports = router;