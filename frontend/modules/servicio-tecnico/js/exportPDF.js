import { formatPEN, parseNumber } from './calculations.js';

export function exportToPDF(year, month, days) {
  if (typeof window.jspdf === 'undefined') {
    throw new Error('La librería jsPDF no está cargada');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4');
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
  doc.rect(0, 0, 297, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dashboard de ingresos - ${monthName} ${year}`, 14, 12);
  doc.setTextColor(15, 23, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryY = 26;
  const summaryBoxWidth = 48;
  const summaryBoxes = [
    { label: 'Producción ST1', value: formatPEN(summary.prodSt1), x: 12 },
    { label: 'Producción ST2', value: formatPEN(summary.prodSt2), x: 66 },
    { label: 'Total Efectivo', value: formatPEN(summary.totalCash), x: 120 },
    { label: 'Total Yape', value: formatPEN(summary.totalYape), x: 174 },
    { label: 'Total General', value: formatPEN(summary.totalGeneral), x: 228 }
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

  const headings = ['Día', 'ST1 Efectivo', 'ST1 Yape', 'ST2 Efectivo', 'ST2 Yape', 'Total Efectivo', 'Total Yape', 'Total General'];

  const body = sortedDays.map((day) => {
    const st1Cash = parseNumber(day?.st1?.cash);
    const st1Yape = parseNumber(day?.st1?.yape);
    const st2Cash = parseNumber(day?.st2?.cash);
    const st2Yape = parseNumber(day?.st2?.yape);
    const totalCash = st1Cash + st2Cash;
    const totalYape = st1Yape + st2Yape;
    const totalGeneral = totalCash + totalYape;

    return [
      String(day?.day ?? ''),
      formatPEN(st1Cash),
      formatPEN(st1Yape),
      formatPEN(st2Cash),
      formatPEN(st2Yape),
      formatPEN(totalCash),
      formatPEN(totalYape),
      formatPEN(totalGeneral)
    ];
  });

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
      0: { cellWidth: 12 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 34 },
      6: { cellWidth: 34 },
      7: { cellWidth: 36 }
    }
  });

  if (!sortedDays.length) {
    doc.setFontSize(11);
    doc.text('No hay registros para este mes.', 14, 60);
  }

  doc.save(`diario-servicio-tecnico-${year}-${String(month).padStart(2, '0')}.pdf`);
}
