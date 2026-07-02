// backend/controllers/reporteController.js

const fs = require('fs');

const reporteService =
    require('../services/reporteService');

// Carga perezosa de la librería que usa `sharp`/`canvas` para evitar consumir
// memoria al iniciar el proceso. Se require solo cuando se solicita la imagen.
let reporteImageService;


// ==========================================
// DESCARGAR REPORTE JSON
// ==========================================
const descargarReporteDiario = async (req, res) => {
    try {

        const userId =
            req.user.role === 'TECNICO'
                ? req.user.id
                : req.query.tecnicoId;

        if (!userId) {
            return res.status(400).json({
                message: 'Se requiere ID del técnico'
            });
        }

        const reporte =
            await reporteService.generarReporteDiario(userId, req.query.fecha);

        res.setHeader(
            'Content-Disposition',
            `attachment; filename=reporte_${reporte.fecha}_${reporte.tecnico}.json`
        );

        res.setHeader(
            'Content-Type',
            'application/json'
        );

        res.json(reporte);

    } catch (error) {

        console.error('[Reporte JSON]', error);

        res.status(error.statusCode || 500).json({
            message: 'Error al generar reporte JSON'
        });
    }
};


// ==========================================
// DESCARGAR REPORTE JPG
// ==========================================
const descargarReporteImagen = async (req, res) => {
    try {

        const userId =
            req.user.role === 'TECNICO'
                ? req.user.id
                : req.query.tecnicoId;

        if (!userId) {
            return res.status(400).json({
                message: 'Se requiere ID del técnico'
            });
        }

        // Generar datos
        const reporte =
            await reporteService.generarReporteDiario(userId, req.query.fecha);

        // Generar imagen (carga perezosa)
        if (!reporteImageService) {
            reporteImageService = require('../services/reportes/reporteImageService');
        }

        const imageResult = await reporteImageService.generarReporteJPG(reporte);

        // Headers descarga
        res.setHeader(
            'Content-Type',
            'image/jpeg'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${imageResult.fileName}`
        );

        // Enviar archivo
        res.sendFile(imageResult.outputPath, async (err) => {

            // Limpiar archivo temporal
            try {

                if (fs.existsSync(imageResult.outputPath)) {
                    fs.unlinkSync(imageResult.outputPath);
                }

            } catch (cleanupError) {
                console.error(
                    '[Reporte JPG] Error limpiando archivo:',
                    cleanupError
                );
            }

            if (err) {
                console.error(
                    '[Reporte JPG] Error enviando archivo:',
                    err
                );
            }
        });

    } catch (error) {

        console.error('[Reporte JPG]', error);

        res.status(error.statusCode || 500).json({
            message: 'Error al generar reporte JPG'
        });
    }
};


module.exports = {
    descargarReporteDiario,
    descargarReporteImagen
};
