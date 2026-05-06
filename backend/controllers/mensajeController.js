// backend/controllers/mensajeController.js
const mensajeService = require('../services/mensajeService');

const getMensajes = async (req, res) => {
    try {
        // ADMIN ve todos los mensajes para agrupar conversaciones en el frontend
        // TECNICO solo ve los suyos (enviados + recibidos)
        if (req.user.role === 'TECNICO') {
            const mensajes = await mensajeService.getMensajesByParticipant(req.user.id);
            res.json(mensajes);
        } else {
            const mensajes = await mensajeService.getMensajes();
            res.json(mensajes);
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
};

const createMensaje = async (req, res) => {
    try {
        const { contenido, para } = req.body;

        // Validación básica
        if (!contenido || !contenido.trim()) {
            return res.status(400).json({ error: 'El contenido del mensaje es obligatorio' });
        }

        // `para` es obligatorio para chat bilateral
        if (!para) {
            return res.status(400).json({ error: 'El destinatario es obligatorio' });
        }

        const mensaje = await mensajeService.createMensaje({
            de: req.user.id,
            para: para,
            contenido: contenido.trim(),
            leido: false
        });

        res.status(201).json(mensaje);
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
};

const marcarLeido = async (req, res) => {
    try {
        await mensajeService.marcarLeido(req.params.id);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar mensaje' });
    }
};

module.exports = { getMensajes, createMensaje, marcarLeido };