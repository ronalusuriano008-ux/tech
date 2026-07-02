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

    const servicios = Array.isArray(data.servicios) ? data.servicios : [];

    // ===============================
    // TAMAÑO (similar al html2canvas scale=3)
    // ===============================
    const width = 1920;
    const height = Math.max(1080, 420 + (servicios.length * 58) + 260);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // ===============================
    // PALETA (igual a tu web)
    // ===============================
    const black = '#000000';
    const soft = '#6b7280';
    const line = '#d1d5db';
    const bg = '#ffffff';

    // ===============================
    // FONDO
    // ===============================
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // ===============================
    // TIPOGRAFÍA (proporcional)
    // ===============================
    const base = 1.2;

    const font = {
        title: 32 * base,
        normal: 22 * base,
        small: 18 * base,
        bold: 24 * base
    };

    const rowH = 48 * base;
    const gap = 40 * base;

    // ===============================
    // HEADER (igual HTML)
    // ===============================
    ctx.fillStyle = black;
    ctx.font = `bold ${font.title}px Sans`;
    ctx.fillText('Reporte Diario', 80, 80);

    ctx.font = `${font.normal}px Sans`;
    ctx.fillText(`Técnico: ${data.tecnico || ''}`, 80, 120);

    ctx.textAlign = 'right';
    ctx.fillText(`Fecha: ${data.fecha || ''}`, width - 80, 120);
    ctx.textAlign = 'left';

    // línea header
    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.moveTo(80, 145);
    ctx.lineTo(width - 80, 145);
    ctx.stroke();

    // ===============================
    // TABLA HEADER
    // ===============================
    let y = 200;

    ctx.fillStyle = soft;
    ctx.font = `bold ${font.bold}px Sans`;

    const c1 = 120;
    const c2 = 350;
    const c3 = 1300;
    const c4 = 1500;
    const c5 = 1720;

    ctx.fillText('HORA', c1, y);
    ctx.fillText('SERVICIO', c2, y);

    ctx.textAlign = 'right';
    ctx.fillText('PRECIO', c3, y);
    ctx.fillText('COSTO', c4, y);
    ctx.fillText('UTILIDAD', c5, y);
    ctx.textAlign = 'left';

    y += 20;

    ctx.strokeStyle = black;
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(width - 80, y);
    ctx.stroke();

    // ===============================
    // BODY (servicios HTML → canvas)
    // ===============================
    servicios.forEach((s) => {

        y += rowH;

        ctx.fillStyle = black;
        ctx.font = `${font.normal}px Sans`;
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
        ctx.font = `bold ${font.bold}px Sans`;
        ctx.fillText(money(s.utilidad), c5, y);

        ctx.textAlign = 'left';

        // línea igual border-bottom HTML
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = line;
        ctx.beginPath();
        ctx.moveTo(c2, y + 10);
        ctx.lineTo(c5 + 80, y + 10);
        ctx.stroke();
        ctx.setLineDash([]);
    });

    // ===============================
    // TOTALES (igual flex HTML)
    // ===============================
    y += 120;

    const totals = [
        { label: `Ingresos (${servicios.length} srv)`, value: data.totalIngresos },
        { label: 'Costos', value: data.totalCostos },
        { label: 'Utilidad', value: data.utilidadTotal },
        { label: 'Distribución de utilidad', value: toNumber(data.utilidadTotal) / 2 }
    ];

    const startX = 120;

    ctx.textAlign = 'left';

    totals.forEach(t => {

        ctx.fillStyle = soft;
        ctx.font = `${font.normal}px Sans`;
        ctx.fillText(t.label, startX, y);

        ctx.fillStyle = black;
        ctx.font = `bold ${font.bold}px Sans`;
        ctx.fillText(money(t.value), startX + 500, y);

        y += gap;
    });

    // ===============================
    // FOOTER
    // ===============================
    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.moveTo(80, height - 80);
    ctx.lineTo(width - 80, height - 80);
    ctx.stroke();

    ctx.fillStyle = soft;
    ctx.font = `${font.small}px Sans`;
    ctx.fillText(
        `Documento generado automáticamente desde ${url}.`,
        80,
        height - 45
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = black;
    ctx.font = `bold ${font.small}px Sans`;
    ctx.fillText('2026', width - 80, height - 45);

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
