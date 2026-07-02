import { formatPEN } from './calculations.js';

export function exportToPDF(year, month, days) {
    if (typeof window.jspdf === 'undefined') {
        throw new Error('La librería jsPDF no está cargada');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    const daysInMonth = new Date(year, month, 0).getDate();
    const pageWidth = doc.internal.pageSize.getWidth();

    let acumCash = 0;
    let acumYape = 0;

    // Paleta de colores moderna
    const colors = {
        primaryDark: [30, 41, 59],
        primaryMid: [71, 85, 105],
        accentBlue: [59, 130, 246],
        accentPurple: [139, 92, 246],
        accentGreen: [16, 185, 129],
        accentYellow: [245, 158, 11],
        bgLight: [248, 250, 252],
        bgBlue: [219, 234, 254],
        bgPurple: [237, 233, 254],
        bgGreen: [209, 250, 229],
        textDark: [15, 23, 42],
        textMuted: [100, 116, 139],
    };

    // Cabecera
    doc.setFillColor(...colors.primaryDark);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("REPORTE DE INGRESOS", 14, 12);
    
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const monthName = monthNames[month - 1];
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.accentBlue);
    doc.text(`${monthName} ${year}`, pageWidth - 14, 12, { align: "right" });

    // Línea decorativa
    doc.setFillColor(...colors.accentBlue);
    doc.rect(0, 18, pageWidth, 1.5, 'F');
    doc.setFillColor(...colors.accentPurple);
    doc.rect(0, 19.5, pageWidth, 0.5, 'F');

    // Tabla
    const head = [[
        "DÍA",
        "ST 1\nEFECTIVO",
        "ST 1\nYAPE",
        "ST 2\nEFECTIVO",
        "ST 2\nYAPE",
        "TOTAL\nEFECTIVO",
        "TOTAL\nYAPE",
        "ACUM.\nEFECTIVO",
        "ACUM.\nYAPE"
    ]];

    const body = [];

    for (let i = 1; i <= daysInMonth; i++) {
        const d = days.find(x => x.day === i);

        const st1Cash = d?.st1?.cash || 0;
        const st1Yape = d?.st1?.yape || 0;
        const st2Cash = d?.st2?.cash || 0;
        const st2Yape = d?.st2?.yape || 0;

        const totalCash = st1Cash + st2Cash;
        const totalYape = st1Yape + st2Yape;

        acumCash += totalCash;
        acumYape += totalYape;

        body.push([
            i,
            formatPEN(st1Cash),
            formatPEN(st1Yape),
            formatPEN(st2Cash),
            formatPEN(st2Yape),
            formatPEN(totalCash),
            formatPEN(totalYape),
            formatPEN(acumCash),
            formatPEN(acumYape)
        ]);
    }

    doc.autoTable({
        head,
        body,
        startY: 24,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 4,
            halign: 'center',
            valign: 'middle',
            lineColor: [226, 232, 240],
            lineWidth: 0.3,
            textColor: [...colors.textDark]
        },
        headStyles: {
            fillColor: [...colors.primaryDark],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 5
        },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: [...colors.primaryMid], cellWidth: 18 },
            5: { fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [22, 101, 52] },
            6: { fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [22, 101, 52] },
            7: { fontStyle: 'bold', fillColor: [...colors.bgBlue], textColor: [30, 64, 175] },
            8: { fontStyle: 'bold', fillColor: [...colors.bgBlue], textColor: [30, 64, 175] }
        }
    });

    // Resumen
    let y = doc.lastAutoTable.finalY + 12;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, pageWidth - 28, 35, 3, 3, 'F');
    doc.setFillColor(...colors.accentPurple);
    doc.rect(14, y, 2, 35, 'F');

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primaryDark);
    doc.text("RESUMEN FINANCIERO DEL MES", 22, y + 9);

    doc.setDrawColor(226, 232, 240);
    doc.line(22, y + 12, pageWidth - 22, y + 12);

    // Bloque Efectivo
    doc.setFillColor(...colors.bgGreen);
    doc.roundedRect(22, y + 15, 75, 16, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textMuted);
    doc.text("TOTAL EFECTIVO", 27, y + 22);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.accentGreen);
    doc.text(formatPEN(acumCash), 27, y + 29);

    // Bloque Yape
    doc.setFillColor(...colors.bgPurple);
    doc.roundedRect(107, y + 15, 75, 16, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textMuted);
    doc.text("TOTAL YAPE", 112, y + 22);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.accentPurple);
    doc.text(formatPEN(acumYape), 112, y + 29);

    // Bloque Total General
    doc.setFillColor(...colors.primaryDark);
    doc.roundedRect(192, y + 14, pageWidth - 220, 18, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("GRAN TOTAL", 197, y + 22);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(formatPEN(acumCash + acumYape), 197, y + 30);

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);

    doc.setFontSize(8);
    doc.setTextColor(...colors.textMuted);
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    doc.text(`Panel de Control VixBox | Generado el: ${dateStr}`, pageWidth / 2, pageHeight - 4, { align: "center" });

    doc.save(`Reporte_Ingresos_${year}_${monthName}.pdf`);
}
