import { formatPEN } from './calculations.js';

export function exportToExcel(year, month, days) {
    if (typeof XLSX === 'undefined') return alert('Librería XLSX no cargada');
    
    const daysInMonth = new Date(year, month, 0).getDate();
    let acumCash = 0, acumYape = 0;
    const aoa = [["Fecha", "ST1 Efectivo", "ST1 Yape", "ST2 Efectivo", "ST2 Yape", "Total Efectivo", "Total Yape", "Acumulado Efectivo", "Acumulado Yape"]];

    for (let i = 1; i <= daysInMonth; i++) {
        const d = days.find(x => x.day === i);
        const st1Cash = d?.st1?.cash || 0, st1Yape = d?.st1?.yape || 0;
        const st2Cash = d?.st2?.cash || 0, st2Yape = d?.st2?.yape || 0;
        const totalCash = st1Cash + st2Cash, totalYape = st1Yape + st2Yape;
        acumCash += totalCash; acumYape += totalYape;
        aoa.push([i, st1Cash, st1Yape, st2Cash, st2Yape, totalCash, totalYape, acumCash, acumYape]);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${year}-${month}`);
    XLSX.writeFile(wb, `Ingresos_${year}_${month}.xlsx`);
}
