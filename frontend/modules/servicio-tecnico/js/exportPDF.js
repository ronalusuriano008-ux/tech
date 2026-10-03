import { formatPEN, parseNumber } from './calculations.js';

export function exportToPDF(year, month, days) {
  if (typeof window.jspdf === 'undefined') {
    throw new Error('La librería jsPDF no está cargada');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthName = monthNames[month - 1] || '';
  const sortedDays = Array.isArray(days) ? [...days].sort((a, b) => Number(a.day) - Number(b.day)) : [];

  const calcSummary = () => {
    let prodSt1 = 0;
    let prodSt2 = 0;
    let totalCash = 0;
    let totalYape = 0;

    sortedDays.forEach((day) => {
      const st1Cash = parseNumber(day?.st1?.cash);
      const st1Yape = parseNumber(day?.st1?.yape);
      const st2Cash = parseNumber(day?.st2?.cash);
      const st2Yape = parseNumber(day?.st2?.yape);

      prodSt1 += st1Cash + st1Yape;
      prodSt2 += st2Cash + st2Yape;
      totalCash += st1Cash + st2Cash;
      totalYape += st1Yape + st2Yape;
    });

    return {
      prodSt1,
      prodSt2,
      totalCash,
      totalYape,
      totalGeneral: totalCash + totalYape
    };
  };

  const summary = calcSummary();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`ingresos servicio tecnico - ${monthName} ${year}`, pageWidth / 2, 13, { align: 'center' });
  doc.setTextColor(15, 23, 42);

  const summaryY = 28;
  const summaryBoxWidth = 50;
  const summaryGap = 8;
  const summaryStartX = (pageWidth - (5 * summaryBoxWidth + 4 * summaryGap)) / 2;
  const summaryBoxes = [
    { label: 'Producción ST1', value: formatPEN(summary.prodSt1), color: [59, 130, 246] },
    { label: 'Producción ST2', value: formatPEN(summary.prodSt2), color: [16, 185, 129] },
    { label: 'Total Efectivo', value: formatPEN(summary.totalCash), color: [245, 158, 11] },
    { label: 'Total Yape', value: formatPEN(summary.totalYape), color: [168, 85, 247] },
    { label: 'Total General', value: formatPEN(summary.totalGeneral), color: [15, 23, 42] }
  ];

  summaryBoxes.forEach((box, index) => {
    const x = summaryStartX + index * (summaryBoxWidth + summaryGap);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, summaryY, summaryBoxWidth, 18, 2, 2, 'F');
    doc.setDrawColor(148, 163, 184);
    doc.roundedRect(x, summaryY, summaryBoxWidth, 18, 2, 2, 'S');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(box.label, x + 3, summaryY + 6);
    doc.setTextColor(...box.color);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(box.value, x + 3, summaryY + 14);
  });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');

  const headings = ['Día', 'ST1 Efe', 'ST1 Yape', 'ST2 Efe', 'ST2 Yape', 'Total Efe', 'Total Yape', 'Total', 'Comentario'];

  const body = sortedDays.map((day) => {
    const st1Cash = parseNumber(day?.st1?.cash);
    const st1Yape = parseNumber(day?.st1?.yape);
    const st2Cash = parseNumber(day?.st2?.cash);
    const st2Yape = parseNumber(day?.st2?.yape);
    const totalCash = st1Cash + st2Cash;
    const totalYape = st1Yape + st2Yape;
    const totalGeneral = totalCash + totalYape;
    const commentText = String(day?.comment || '').trim();

    return [
      String(day?.day ?? ''),
      formatPEN(st1Cash),
      formatPEN(st1Yape),
      formatPEN(st2Cash),
      formatPEN(st2Yape),
      formatPEN(totalCash),
      formatPEN(totalYape),
      formatPEN(totalGeneral),
      commentText || 'Sin observación'
    ];
  });

  doc.autoTable({
    head: [headings],
    body,
    startY: 56,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [0, 0, 0],
      cellPadding: 2.2,
      overflow: 'linebreak',
      valign: 'middle'
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 2.2,
      overflow: 'linebreak',
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [0, 0, 0]
    },
    margin: { left: 6, right: 6 },
    tableWidth: pageWidth - 12,
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', textColor: [0, 0, 0] },
      1: { cellWidth: 30, textColor: [0, 0, 0] },
      2: { cellWidth: 30, textColor: [0, 0, 0] },
      3: { cellWidth: 30, textColor: [0, 0, 0] },
      4: { cellWidth: 30, textColor: [0, 0, 0] },
      5: { cellWidth: 30, textColor: [0, 0, 0] },
      6: { cellWidth: 30, textColor: [0, 0, 0] },
      7: { cellWidth: 28, textColor: [0, 0, 0] },
      8: { cellWidth: 58, textColor: [220, 38, 38] }
    }
  });

  const notesY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 62;
  const notes = sortedDays
    .filter((day) => String(day?.comment || '').trim())
    .map((day) => `Día ${day.day}: ${String(day.comment).trim()}`);

  if (notes.length > 0) {
    doc.setFillColor(255, 241, 242);
    doc.roundedRect(12, notesY, pageWidth - 24, 28, 3, 3, 'F');
    doc.setDrawColor(220, 38, 38);
    doc.roundedRect(12, notesY, pageWidth - 24, 28, 3, 3, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(9);
    doc.text('Observaciones', pageWidth / 2, notesY + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(185, 28, 28);
    const lines = notes.slice(0, 3).map((note) => doc.splitTextToSize(note, pageWidth - 40));
    const flatLines = lines.flat();
    doc.text(flatLines, 18, notesY + 16);
  } else {
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8.5);
    doc.text('No hay observaciones registradas para este mes.', pageWidth / 2, notesY + 8, { align: 'center' });
  }

  if (!sortedDays.length) {
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(11);
    doc.text('No hay registros para este mes.', pageWidth / 2, 65, { align: 'center' });
  }

  doc.save(`diario-servicio-tecnico-${year}-${String(month).padStart(2, '0')}.pdf`);
}
