// backend/controllers/reporteController.js
const reporteService = require('../services/reporteService');

const descargarReporteDiario = async (req, res) => {
    try {
        const userId = req.user.role === 'TECNICO' ? req.user.id : req.query.tecnicoId;
        if (!userId) return res.status(400).json({ message: 'Se requiere ID del técnico' });
        
        const reporte = await reporteService.generarReporteDiario(userId);
        
        res.setHeader('Content-Disposition', `attachment; filename=reporte_${reporte.fecha}_${reporte.tecnico}.json`);
        res.setHeader('Content-Type', 'application/json');
        res.json(reporte);
    } catch (error) {
        res.status(500).json({ message: 'Error al generar reporte' });
    }
};

module.exports = { descargarReporteDiario };