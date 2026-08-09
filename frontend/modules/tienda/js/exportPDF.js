import { formatCurrency, parseDecimal } from './calculations.js';

export function exportToPDF(year, month, days) {
  if (typeof window.jspdf === 'undefined') {
    throw new Error('La librería jsPDF no está cargada');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4');
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthName = monthNames[month - 1] || '';
  const sortedDays = Array.isArray(days) ? [...days].sort((a, b) => Number(a.day) - Number(b.day)) : [];

  const totals = sortedDays.reduce((acc, day) => {
    acc.totalDiario += parseDecimal(day.totalDiario);
    acc.bancoDepositado += parseDecimal(day.bancoDepositado);
    acc.retiroTienda += parseDecimal(day.retiroTienda);
    acc.retiroBanco += parseDecimal(day.retiroBanco);
    acc.saldoBanco += parseDecimal(day.saldoBanco);
    acc.acumuladoTienda += parseDecimal(day.acumuladoTienda);
    return acc;
  }, {
    totalDiario: 0,
    bancoDepositado: 0,
    retiroTienda: 0,
    retiroBanco: 0,
    saldoBanco: 0,
    acumuladoTienda: 0
  });

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Control Diario - ${monthName} ${year}`, 14, 12);
  doc.setTextColor(15, 23, 42);

  const summaryY = 25;
  const summaryBoxWidth = 47;
  const summaryBoxes = [
    { label: 'Total diario', value: formatCurrency(totals.totalDiario), x: 12 },
    { label: 'Depósito banco', value: formatCurrency(totals.bancoDepositado), x: 66 },
    { label: 'Retiro tienda', value: formatCurrency(totals.retiroTienda), x: 120 },
    { label: 'Retiro banco', value: formatCurrency(totals.retiroBanco), x: 174 },
    { label: 'Saldo banco', value: formatCurrency(totals.saldoBanco), x: 228 },
    { label: 'Acumulado', value: formatCurrency(totals.acumuladoTienda), x: 282 }
  ];

  summaryBoxes.forEach((box) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(box.x, summaryY, summaryBoxWidth, 18, 2, 2, 'F');
    doc.setDrawColor(148, 163, 184);
    doc.roundedRect(box.x, summaryY, summaryBoxWidth, 18, 2, 2, 'S');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(box.label, box.x + 3, summaryY + 6);
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(box.value, box.x + 3, summaryY + 14);
  });

  const headings = [
    'Día',
    'Tienda 1',
    'Tienda 2',
    'Tienda 3',
    'Total Diario',
    'Banco Depositado',
    'Retiro Tienda',
    'Retiro Banco',
    'Saldo Banco',
    'Acumulado Tienda'
  ];

  const body = sortedDays.map((day) => [
    day.day,
    formatCurrency(parseDecimal(day.tienda1)),
    formatCurrency(parseDecimal(day.tienda2)),
    formatCurrency(parseDecimal(day.tienda3)),
    formatCurrency(parseDecimal(day.totalDiario)),
    formatCurrency(parseDecimal(day.bancoDepositado)),
    formatCurrency(parseDecimal(day.retiroTienda)),
    formatCurrency(parseDecimal(day.retiroBanco)),
    formatCurrency(parseDecimal(day.saldoBanco)),
    formatCurrency(parseDecimal(day.acumuladoTienda))
  ]);

  doc.autoTable({
    head: [headings],
    body,
    startY: 52,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
    styles: { fontSize: 7.5, cellPadding: 2.2, overflow: 'linebreak' },
    margin: { left: 8, right: 8 },
    tableWidth: 280,
    columnStyles: {
      0: { cellWidth: 11 },
      1: { cellWidth: 28 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 33 },
      5: { cellWidth: 34 },
      6: { cellWidth: 30 },
      7: { cellWidth: 30 },
      8: { cellWidth: 30 },
      9: { cellWidth: 33 }
    }
  });

  if (!sortedDays.length) {
    doc.setFontSize(11);
    doc.text('No hay registros para este mes.', 14, 52);
  }

  doc.save(`tienda-${year}-${String(month).padStart(2, '0')}.pdf`);
}
