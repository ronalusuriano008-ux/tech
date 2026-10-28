const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const sharp = require('sharp');
const { generarReporteJPG } = require('../services/reportes/reporteImageService');

test('generarReporteJPG crea una imagen JPEG sin depender de canvas', async () => {
    const result = await generarReporteJPG({
        tecnico: "Técnico <A&B>",
        fecha: '2026-10-27',
        servicios: [
            {
                hora: '10:30',
                servicio: 'Cambio <pantalla> & revisión',
                modelo: 'Modelo "X"',
                precio: 120,
                costo: 40,
                utilidad: 80
            }
        ],
        totalIngresos: 120,
        totalCostos: 40,
        utilidadTotal: 80
    });

    try {
        const image = fs.readFileSync(result.outputPath);
        const metadata = await sharp(image).metadata();

        assert.equal(result.fileName.endsWith('.jpg'), true);
        assert.equal(metadata.format, 'jpeg');
        assert.equal(metadata.width, 1920);
        assert.ok(metadata.height >= 1080);
    } finally {
        if (fs.existsSync(result.outputPath)) {
            fs.unlinkSync(result.outputPath);
        }
    }
});
