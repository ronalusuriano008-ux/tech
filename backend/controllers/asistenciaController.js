// backend/controllers/asistenciaController.js
const asistenciaService = require('../services/asistenciaService');

const getAsistencia = async (req, res) => {
    try {
        const { fecha } = req.query;
        const userId = req.user.role === 'TECNICO' ? req.user.id : undefined;
        const asistencias = await asistenciaService.getAsistencia(fecha, userId);
        res.json(asistencias);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener asistencia' });
    }
};

const checkIn = async (req, res) => {
    try {
        const registro = await asistenciaService.registerCheckIn(req.user.id);
        res.status(201).json(registro);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const checkOut = async (req, res) => {
    try {
        const registro = await asistenciaService.registerCheckOut(req.user.id);
        res.json(registro);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAsistencia, checkIn, checkOut };