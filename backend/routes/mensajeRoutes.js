const express = require('express');
const router = express.Router();
// Ya no necesitamos importar adminMiddleware aquí
const { authMiddleware } = require('../middleware/auth'); 
const mensajeController = require('../controllers/mensajeController');

// 1. Todos los que usen estas rutas deben estar logueados
router.use(authMiddleware);

// 2. GET /mensajes
// QUITAMOS adminMiddleware para que el técnico pueda leer su propio chat
router.get('/', mensajeController.getMensajes);

// 3. POST /mensajes
// El técnico debe poder enviar, así que esto ya estaba bien
router.post('/', mensajeController.createMensaje);

// 4. PUT /mensajes/:id/leido
// QUITAMOS adminMiddleware para que el técnico pueda marcar mensajes como leídos
router.put('/:id/leido', mensajeController.marcarLeido);

module.exports = router;