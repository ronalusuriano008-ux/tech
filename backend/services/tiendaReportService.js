const PDFDocument = require('pdfkit');

function buildSummaryItems(monthResult = {}) {
  const { resumen = {} } = monthResult || {};

  return [
    ['Total Mes', resumen.totalMes],
    ['Depósito Banco', resumen.bancoDepositado],
    ['Acumulado Tienda', resumen.saldoTienda],
    ['Saldo Banco', resumen.saldoBanco]
  ];
}

function generatePdfBuffer(monthResult, title) {
  const { dias = [] } = monthResult || {};

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));

  const promise = new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const tableLeft = doc.page.margins.left;
  const rowHeight = 11.5;
  const headerHeight = 14;

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text(title, { align: 'center' });
  doc.moveDown(0.25);

  const headers = ['Día','Tienda 1','Tienda 2','Tienda 3','Total Diario','Banco Depositado','Retiro Tienda','Retiro Banco','Saldo Banco','Acumulado Tienda'];
  const colWidths = [30, 52, 52, 52, 58, 56, 54, 56, 52, 60];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

  const drawHeader = (y) => {
    doc.fillColor('#0f172a');
    doc.rect(tableLeft, y, tableWidth, headerHeight).fill();
    doc.fillColor('#ffffff');
    let x = tableLeft;
    headers.forEach((header, index) => {
      doc.font('Helvetica-Bold').fontSize(7.2);
      doc.text(header, x + 3, y + 2.8, { width: colWidths[index] - 6, align: index === 0 ? 'left' : 'right' });
      x += colWidths[index];
    });
  };

  const drawRow = (y, values, isEven) => {
    doc.fillColor(isEven ? '#ffffff' : '#f8fafc');
    doc.rect(tableLeft, y, tableWidth, rowHeight).fill();
    doc.strokeColor('#dbe2ea');
    doc.lineWidth(0.35);
    doc.rect(tableLeft, y, tableWidth, rowHeight).stroke();

    doc.fillColor('#111827');
    let x = tableLeft;
    values.forEach((value, index) => {
      const text = index === 0 ? String(value) : `S/. ${value}`;
      doc.font('Helvetica').fontSize(7.2);
      doc.text(text, x + 3, y + 2.2, { width: colWidths[index] - 6, align: index === 0 ? 'left' : 'right' });
      if (index < values.length - 1) {
        doc.moveTo(x + colWidths[index], y).lineTo(x + colWidths[index], y + rowHeight).stroke();
      }
      x += colWidths[index];
    });
  };

  let currentY = doc.y;
  drawHeader(currentY);
  currentY += headerHeight;

  dias.forEach((day, index) => {
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 70) {
      doc.addPage();
      currentY = doc.page.margins.top + 18;
      drawHeader(currentY);
      currentY += headerHeight;
    }

    const values = [
      day.day,
      Number(day.tienda1 || 0).toFixed(2),
      Number(day.tienda2 || 0).toFixed(2),
      Number(day.tienda3 || 0).toFixed(2),
      Number(day.totalDiario || 0).toFixed(2),
      Number(day.bancoDepositado || 0).toFixed(2),
      Number(day.retiroTienda || 0).toFixed(2),
      Number(day.retiroBanco || 0).toFixed(2),
      Number(day.saldoBanco || 0).toFixed(2),
      Number(day.acumuladoTienda || 0).toFixed(2)
    ];

    drawRow(currentY, values, index % 2 === 0);
    currentY += rowHeight;
  });

  doc.y = currentY;
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('Resumen Mensual');
  doc.moveDown(0.25);
  doc.font('Helvetica').fontSize(9).fillColor('#334155');

  const summaryItems = buildSummaryItems(monthResult);

  const summaryBoxX = tableLeft;
  const summaryBoxY = doc.y;
  const summaryBoxWidth = pageWidth;
  const summaryBoxHeight = 34 + Math.ceil(summaryItems.length / 2) * 18;
  doc.fillColor('#f8fafc');
  doc.rect(summaryBoxX, summaryBoxY, summaryBoxWidth, summaryBoxHeight).fill();
  doc.strokeColor('#d1d5db');
  doc.rect(summaryBoxX, summaryBoxY, summaryBoxWidth, summaryBoxHeight).stroke();

  const cardWidth = (summaryBoxWidth - 24) / 2;
  summaryItems.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = summaryBoxX + 12 + col * cardWidth;
    const y = summaryBoxY + 10 + row * 18;
    doc.fillColor('#ffffff');
    doc.rect(x, y, cardWidth, 15).fill();
    doc.strokeColor('#e2e8f0');
    doc.rect(x, y, cardWidth, 15).stroke();
    doc.font('Helvetica-Bold').fontSize(7.2).fillColor('#64748b').text(label, x + 4, y + 2.2);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(`S/. ${Number(value || 0).toFixed(2)}`, x + 4, y + 8.2);
  });

  doc.end();

  return promise;
}

module.exports = {
  buildSummaryItems,
  generatePdfBuffer
};
