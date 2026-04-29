// backend/routes/backupRoutes.js

const express = require('express');
const router = express.Router();

const {
    exportBackup,
    importBackup
} = require('../controllers/backupController');

// GET → descargar backup
router.get('/export', exportBackup);

// POST → restaurar backup
router.post('/import', importBackup);

module.exports = router;