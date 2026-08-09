const { createCanvas } = require('canvas');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const money = (value) => `S/. ${toNumber(value).toFixed(2)}`;

const generarReporteJPG = async (data) => {

    const url = process.env.PUBLIC_BASE_URL || process.env.API_BASE_URL || 'https://api.vixbox.xyz';
    const version = process.env.VERSION || '4.0.1';

    const servicios = Array.isArray(data.servicios) ? data.servicios : [];

    // ===============================
    // TAMAÑO DE IMAGEN
    // ===============================
    const width = 1920;
    const height = Math.max(1080, 420 + (servicios.length * 58) + 260);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // ===============================
    // PALETA DE COLORES
    // ===============================
    const black = '#000000';
    const soft = '#6b7280';
    const line = '#d1d5db';
    const bg = '#ffffff';

    // ===============================
    // MÁRGENES 
    // ===============================
    const marginL = 80;
    const marginR = 80;

    const lineStartX = marginL;
    const lineEndX = width - marginR;

    const contentStartX = marginL + 40;

    // ===============================
    // FONDO 
    // ===============================
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // ===============================
    // TIPOGRAFÍA 
    // ===============================
    const base = 1.40;

    const font = {
        title: 32 * base,
        normal: 22 * base,
        small: 18 * base,
        bold: 24 * base
    };

    const rowH = 48 * base;
    const gap = 40 * base;

    // ===============================
    // HEADER 
    // ===============================
    ctx.fillStyle = black;
    ctx.font = `bold ${font.title}px Arial`;
    ctx.fillText('Reporte Diario', contentStartX, 80);

    ctx.font = `${font.normal}px Arial`;
    ctx.fillText(`Técnico: ${data.tecnico || ''}`, contentStartX, 120);

    ctx.textAlign = 'right';
    ctx.fillText(`Fecha: ${data.fecha || ''}`, lineEndX, 120);
    ctx.textAlign = 'left';

    // línea header
    ctx.strokeStyle = black;
    ctx.beginPath();
    ctx.moveTo(lineStartX, 145);
    ctx.lineTo(lineEndX, 145);
    ctx.stroke();

    // ===============================
    // TABLA HEADER 
    // ===============================
    let y = 200;

    ctx.fillStyle = soft;
    ctx.font = `bold ${font.bold}px Arial`;

    const c1 = contentStartX;
    const c2 = contentStartX + 230;
    const c3 = lineEndX - 620;
    const c4 = lineEndX - 420;
    const c5 = lineEndX - 200;

    ctx.fillText('HORA', c1, y);
    ctx.fillText('SERVICIO', c2, y);

    ctx.textAlign = 'right';
    ctx.fillText('PRECIO', c3, y);
    ctx.fillText('COSTO', c4, y);
    ctx.fillText('UTILIDAD', c5, y);
    ctx.textAlign = 'left';

    y += 20;

    // línea tabla header
    ctx.strokeStyle = black;
    ctx.beginPath();
    ctx.moveTo(lineStartX, y);
    ctx.lineTo(lineEndX, y);
    ctx.stroke();

    // ===============================
    // BODY
    // ===============================
    servicios.forEach((s) => {

        y += rowH;

        ctx.fillStyle = black;
        ctx.font = `${font.normal}px Arial`;
        ctx.fillText(s.hora || '--:--', c1, y);

        ctx.fillStyle = '#111';
        const servicio = s.servicio || 'Servicio';
        const modelo = s.modelo ? ` (${s.modelo})` : '';
        ctx.fillText(`${servicio}${modelo}`, c2, y, 750);

        ctx.textAlign = 'right';

        ctx.fillStyle = black;
        ctx.fillText(money(s.precio), c3, y);

        ctx.fillStyle = soft;
        ctx.fillText(money(s.costo), c4, y);

        ctx.fillStyle = black;
        ctx.font = `bold ${font.bold}px Arial`;
        ctx.fillText(money(s.utilidad), c5, y);

        ctx.textAlign = 'left';

        // línea separación
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = black;
        ctx.beginPath();
        ctx.moveTo(lineStartX, y + 10);
        ctx.lineTo(lineEndX, y + 10);
        ctx.stroke();
        ctx.setLineDash([]);
    });

    // ===============================
    // TOTALES
    // ===============================
    y += 120;

    const totals = [
        { label: `Ingresos (${servicios.length} srv)`, value: data.totalIngresos },
        { label: 'Costos', value: data.totalCostos },
        { label: 'Utilidad', value: data.utilidadTotal },
        { label: 'Distribución de utilidad', value: toNumber(data.utilidadTotal) / 2 }
    ];

    ctx.textAlign = 'left';

    totals.forEach(t => {

        ctx.fillStyle = soft;
        ctx.font = `${font.normal}px Arial`;
        ctx.fillText(t.label, c1, y);

        ctx.fillStyle = black;
        ctx.font = `bold ${font.bold}px Arial`;
        ctx.fillText(money(t.value), c1 + 500, y);

        y += gap;
    });

    // ===============================
    // FOOTER
    // ===============================
    // línea footer
    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.moveTo(lineStartX, height - 80);
    ctx.lineTo(lineEndX, height - 80);
    ctx.stroke();

    ctx.fillStyle = soft;
    ctx.font = `${font.small}px Arial`;
    ctx.fillText(
        `Documento Versión  ${version} ${url}.`,
        contentStartX,
        height - 45
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = black;
    ctx.font = `bold ${font.small}px Arial`;
    ctx.fillText('2026', lineEndX, height - 45);

    // ===============================
    // EXPORTAR JPG
    // ===============================
    const png = canvas.toBuffer('image/png');

    const jpg = await sharp(png)
        .jpeg({ quality: 95 })
        .toBuffer();

    const dir = path.join(__dirname, '../../temp/reportes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const fileName = `reporte-${Date.now()}.jpg`;
    const outputPath = path.join(dir, fileName);

    fs.writeFileSync(outputPath, jpg);

    return { fileName, outputPath };
};

module.exports = { generarReporteJPG };