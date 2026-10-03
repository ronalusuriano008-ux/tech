import { formatCurrency, parseDecimal } from './calculations.js';

function formatWithdrawalNote(dayData) {
  const retiroTienda = Number(dayData.retiroTienda || 0);
  const retiroBanco = Number(dayData.retiroBanco || 0);
  const motivo = String(dayData.motivoRetiro || 'Retiro programado').trim();
  const destino = String(dayData.destinoRetiro || 'sin destino especificado').trim();
  const comentario = String(dayData.comentarioRetiro || '').trim();

  const detalle = [];
  if (retiroTienda > 0) detalle.push(`retiro de ${formatCurrency(retiroTienda)} del acumulado de tiendas`);
  if (retiroBanco > 0) detalle.push(`retiro de ${formatCurrency(retiroBanco)} del acumulado del banco`);

  const base = detalle.length ? detalle.join(' y ') : 'No hubo retiros';
  const extra = `Motivo: ${motivo}. Destino: ${destino}.`;
  return `${base}. ${extra}${comentario ? ` Comentario: ${comentario}.` : ''}`;
}

export function exportToPDF(year, month, days) {
  if (typeof window.jspdf === 'undefined') {
    throw new Error('La librería jsPDF no está cargada');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

  const monthName = monthNames[month - 1] || '';

  const sortedDays = Array.isArray(days)
    ? [...days].sort((a, b) => Number(a.day) - Number(b.day))
    : [];

  const calcSummary = () => {
    let totalDiario = 0;
    let bancoDepositado = 0;
    let retiroTienda = 0;
    let retiroBanco = 0;
    let saldoBanco = 0;
    let acumuladoTienda = 0;

    sortedDays.forEach((day) => {
      totalDiario += parseDecimal(day?.totalDiario);
      bancoDepositado += parseDecimal(day?.bancoDepositado);
      retiroTienda += parseDecimal(day?.retiroTienda);
      retiroBanco += parseDecimal(day?.retiroBanco);
      saldoBanco += parseDecimal(day?.saldoBanco);
      acumuladoTienda += parseDecimal(day?.acumuladoTienda);
    });

    return {
      totalDiario,
      bancoDepositado,
      retiroTienda,
      retiroBanco,
      saldoBanco,
      acumuladoTienda
    };
  };

  const summary = calcSummary();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);

  doc.text(
    `Control diario de tiendas - ${monthName} ${year}`,
    pageWidth / 2,
    13,
    { align: 'center' }
  );

  doc.setTextColor(15, 23, 42);

  const summaryY = 28;
  const summaryBoxWidth = 70;
  const summaryGap = 14;

  const summaryStartX =
    (pageWidth - ((2 * summaryBoxWidth) + summaryGap)) / 2;

  const summaryBoxes = [
    {
      label: 'Saldo tienda disponible',
      value: formatCurrency(summary.acumuladoTienda),
      color: [239, 68, 68]
    },
    {
      label: 'Saldo banco acumulado',
      value: formatCurrency(summary.saldoBanco),
      color: [16, 185, 129]
    }
  ];

  summaryBoxes.forEach((box, index) => {
    const x =
      summaryStartX +
      index * (summaryBoxWidth + summaryGap);

    doc.setFillColor(248, 250, 252);

    doc.roundedRect(
      x,
      summaryY,
      summaryBoxWidth,
      20,
      2,
      2,
      'F'
    );

    doc.setDrawColor(148, 163, 184);

    doc.roundedRect(
      x,
      summaryY,
      summaryBoxWidth,
      20,
      2,
      2,
      'S'
    );

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    doc.text(
      box.label,
      x + 3,
      summaryY + 7,
      {
        maxWidth: summaryBoxWidth - 6
      }
    );

    doc.setTextColor(...box.color);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);

    doc.text(
      box.value,
      x + 3,
      summaryY + 15,
      {
        maxWidth: summaryBoxWidth - 6
      }
    );
  });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');

  const headings = [
    'Día',
    'Tienda 1',
    'Tienda 2',
    'Tienda 3',
    'Retiro tienda',
    'Retiro banco',
    'Saldo banco',
    'Saldo tienda'
  ];

  const body = sortedDays.map((day) => [
    String(day?.day ?? ''),
    formatCurrency(parseDecimal(day?.tienda1)),
    formatCurrency(parseDecimal(day?.tienda2)),
    formatCurrency(parseDecimal(day?.tienda3)),
    formatCurrency(parseDecimal(day?.retiroTienda)),
    formatCurrency(parseDecimal(day?.retiroBanco)),
    formatCurrency(parseDecimal(day?.saldoBanco)),
    formatCurrency(parseDecimal(day?.acumuladoTienda))
  ]);

  /*
   * Ancho total de las columnas:
   *
   * 18 + 28 + 28 + 28 + 32 + 32 + 32 + 32 = 230 mm
   *
   * Se conserva este ancho y se centra manualmente
   * en la página A4 horizontal.
   */
  const tableWidth = 230;
  const tableLeft = (pageWidth - tableWidth) / 2;

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
      valign: 'middle',
      fontSize: 8
    },

    bodyStyles: {
      fontSize: 8.4,
      textColor: [15, 23, 42],
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle'
    },

    styles: {
      fontSize: 8.4,
      cellPadding: 3,
      overflow: 'linebreak',
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
      halign: 'center'
    },

    /*
     * La tabla ahora conserva exactamente
     * los 230 mm definidos por las columnas
     * y se coloca en el centro de la página.
     */
    margin: {
      left: tableLeft,
      right: tableLeft
    },

    tableWidth,

    columnStyles: {
      0: {
        cellWidth: 18,
        halign: 'center'
      },
      1: {
        cellWidth: 28
      },
      2: {
        cellWidth: 28
      },
      3: {
        cellWidth: 28
      },
      4: {
        cellWidth: 32
      },
      5: {
        cellWidth: 32
      },
      6: {
        cellWidth: 32
      },
      7: {
        cellWidth: 32
      }
    }
  });

  const notesY = doc.lastAutoTable
    ? doc.lastAutoTable.finalY + 8
    : 62;

  const notes = sortedDays.flatMap((day) => {
    const retiroTienda = Number(day?.retiroTienda || 0);
    const retiroBanco = Number(day?.retiroBanco || 0);

    if (retiroTienda <= 0 && retiroBanco <= 0) {
      return [];
    }

    const items = [];

    if (retiroTienda > 0) {
      items.push(
        `Día ${day.day}: retiro de ${formatCurrency(retiroTienda)} del acumulado de tiendas. Motivo: ${String(day?.motivoRetiro || 'Retiro programado').trim()}. Destino: ${String(day?.destinoRetiro || 'sin destino especificado').trim()}.`
      );
    }

    if (retiroBanco > 0) {
      items.push(
        `Día ${day.day}: retiro de ${formatCurrency(retiroBanco)} del acumulado del banco. Motivo: ${String(day?.motivoRetiro || 'Retiro programado').trim()}. Destino: ${String(day?.destinoRetiro || 'sin destino especificado').trim()}.`
      );
    }

    return items;
  });

  if (notes.length > 0) {
    const noteHeight = Math.max(
      24,
      15 + notes.length * 6
    );

    const noteX = 16;
    const noteWidth = pageWidth - 32;

    doc.setFillColor(255, 241, 242);

    doc.roundedRect(
      noteX,
      notesY,
      noteWidth,
      noteHeight,
      3,
      3,
      'F'
    );

    doc.setDrawColor(220, 38, 38);

    doc.roundedRect(
      noteX,
      notesY,
      noteWidth,
      noteHeight,
      3,
      3,
      'S'
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(9);

    doc.text(
      'Observaciones',
      pageWidth / 2,
      notesY + 8,
      {
        align: 'center'
      }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(127, 29, 29);

    notes.slice(0, 6).forEach((note, index) => {
      const textY = notesY + 18 + index * 6;

      doc.text(
        doc.splitTextToSize(
          note,
          noteWidth - 12
        ),
        noteX + 6,
        textY
      );
    });
  }

  if (!sortedDays.length) {
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(11);

    doc.text(
      'No hay registros para este mes.',
      pageWidth / 2,
      65,
      {
        align: 'center'
      }
    );
  }

  doc.save(
    `tienda-${year}-${String(month).padStart(2, '0')}.pdf`
  );
}