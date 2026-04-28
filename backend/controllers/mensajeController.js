// backend/controllers/mensajeController.js
const mensajeService = require('../services/mensajeService');

const getMensajes = async (req, res) => {
    try {
        const userId = req.user.role === 'TECNICO' ? req.user.id : undefined;
        const mensajes = await mensajeService.getMensajes(userId);
        res.json(mensajes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener mensajes' });
    }
};

const createMensaje = async (req, res) => {
    try {
        const mensaje = await mensajeService.createMensaje({ ...req.body, de: req.user.id });
        res.status(201).json(mensaje);
    } catch (error) {
        res.status(500).json({ message: 'Error al enviar mensaje' });
    }
};

const marcarLeido = async (req, res) => {
    try {
        await mensajeService.marcarLeido(req.params.id);
        res.json({ message: 'Marcado como leído' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar mensaje' });
    }
};

module.exports = { getMensajes, createMensaje, marcarLeido };