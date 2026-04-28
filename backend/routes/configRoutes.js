// backend/routes/configRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const configController = require('../controllers/configController');

router.use(authMiddleware);
router.get('/', configController.getConfig);
router.put('/', adminMiddleware, configController.updateConfig);

module.exports = router;