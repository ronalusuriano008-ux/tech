const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const appConfig = require('../../../config');

const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const money = (value) => `S/. ${toNumber(value).toFixed(2)}`;

const escapeXml = (value) => String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const generarReporteJPG = async (data) => {
    const url = process.env.PUBLIC_BASE_URL || process.env.API_BASE_URL || 'https://api.vixbox.xyz';
    const version = appConfig.app.version;
    const servicios = Array.isArray(data.servicios) ? data.servicios : [];

    const width = 1920;
    const rowHeight = 67.2;
    const totalsGap = 56;
    const height = Math.ceil(Math.max(1080, 740 + (servicios.length * rowHeight)));

    const marginL = 80;
    const marginR = 80;
    const lineStartX = marginL;
    const lineEndX = width - marginR;
    const contentStartX = marginL + 40;
    const c1 = contentStartX;
    const c2 = contentStartX + 230;
    const c3 = lineEndX - 620;
    const c4 = lineEndX - 420;
    const c5 = lineEndX - 200;
    const rowFontSize = 30.8;
    const totals = [
        { label: `Ingresos (${servicios.length} srv)`, value: data.totalIngresos },
        { label: 'Costos', value: data.totalCostos },
        { label: 'Utilidad', value: data.utilidadTotal },
        { label: 'Distribución de utilidad', value: toNumber(data.utilidadTotal) / 2 }
    ];

    const lines = servicios.map((service, index) => {
        const y = 200 + rowHeight * (index + 1);
        const description = `${service.servicio || 'Servicio'}${service.modelo ? ` (${service.modelo})` : ''}`;

        return `
            <text x="${c1}" y="${y}" class="body">${escapeXml(service.hora || '--:--')}</text>
            <text x="${c2}" y="${y}" class="description" textLength="750" lengthAdjust="spacingAndGlyphs">${escapeXml(description)}</text>
            <text x="${c3}" y="${y}" class="body" text-anchor="end">${escapeXml(money(service.precio))}</text>
            <text x="${c4}" y="${y}" class="muted" text-anchor="end">${escapeXml(money(service.costo))}</text>
            <text x="${c5}" y="${y}" class="total" text-anchor="end">${escapeXml(money(service.utilidad))}</text>
            <path d="M ${lineStartX} ${y + 10} H ${lineEndX}" class="row-divider"/>
        `;
    }).join('');

    const totalsY = 320 + (servicios.length * rowHeight);
    const totalLines = totals.map((item, index) => {
        const y = totalsY + (index * totalsGap);
        return `
            <text x="${c1}" y="${y}" class="muted">${escapeXml(item.label)}</text>
            <text x="${c1 + 500}" y="${y}" class="total">${escapeXml(money(item.value))}</text>
        `;
    }).join('');

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <style>
                text { font-family: Arial, sans-serif; fill: #000000; }
                .title { font-size: 44.8px; font-weight: 700; }
                .body { font-size: ${rowFontSize}px; }
                .description { font-size: ${rowFontSize}px; fill: #111111; }
                .muted { font-size: ${rowFontSize}px; fill: #6b7280; }
                .table-heading { font-size: 33.6px; font-weight: 700; fill: #6b7280; }
                .total { font-size: 33.6px; font-weight: 700; }
                .divider { stroke: #000000; stroke-width: 2; }
                .row-divider { stroke: #000000; stroke-width: 1.5; stroke-dasharray: 2 4; }
                .footer-divider { stroke: #d1d5db; stroke-width: 2; }
            </style>
            <rect width="100%" height="100%" fill="#ffffff"/>
            <text x="${contentStartX}" y="80" class="title">Reporte Diario</text>
            <text x="${contentStartX}" y="120" class="body">Técnico: ${escapeXml(data.tecnico)}</text>
            <text x="${lineEndX}" y="120" class="body" text-anchor="end">Fecha: ${escapeXml(data.fecha)}</text>
            <path d="M ${lineStartX} 145 H ${lineEndX}" class="divider"/>
            <text x="${c1}" y="200" class="table-heading">HORA</text>
            <text x="${c2}" y="200" class="table-heading">SERVICIO</text>
            <text x="${c3}" y="200" class="table-heading" text-anchor="end">PRECIO</text>
            <text x="${c4}" y="200" class="table-heading" text-anchor="end">COSTO</text>
            <text x="${c5}" y="200" class="table-heading" text-anchor="end">UTILIDAD</text>
            <path d="M ${lineStartX} 220 H ${lineEndX}" class="divider"/>
            ${lines}
            ${totalLines}
            <path d="M ${lineStartX} ${height - 80} H ${lineEndX}" class="footer-divider"/>
            <text x="${contentStartX}" y="${height - 45}" class="muted" font-size="25.2px">Documento Versión ${escapeXml(version)} ${escapeXml(url)}.</text>
            <text x="${lineEndX}" y="${height - 45}" class="total" font-size="25.2px" text-anchor="end">2026</text>
        </svg>
    `;

    const jpg = await sharp(Buffer.from(svg))
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
