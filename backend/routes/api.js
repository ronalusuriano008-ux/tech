const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const financeController = require('../controllers/financeController');

router.use(authMiddleware);

router.get('/month/:year/:month', financeController.getMonth);
router.get('/diary', financeController.getDiary);
router.post('/day', financeController.saveDay);
router.delete('/day/:year/:month/:day', financeController.deleteDay);
router.delete('/month/:year/:month', financeController.deleteMonth);

module.exports = router;
