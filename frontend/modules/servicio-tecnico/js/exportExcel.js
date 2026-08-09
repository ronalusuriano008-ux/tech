export function exportToExcel(year, month, days) {
  if (typeof XLSX === 'undefined') throw new Error('La librería XLSX no está cargada');

  const rows = [
    ['Día', 'ST1 Efectivo', 'ST1 Yape', 'ST2 Efectivo', 'ST2 Yape', 'Total Efectivo', 'Total Yape', 'Acumulado Efectivo', 'Acumulado Yape']
  ];

  const sortedDays = Array.isArray(days) ? [...days].sort((a, b) => Number(a.day) - Number(b.day)) : [];

  sortedDays.forEach((day) => {
    const st1Cash = Number(day?.st1?.cash || 0);
    const st1Yape = Number(day?.st1?.yape || 0);
    const st2Cash = Number(day?.st2?.cash || 0);
    const st2Yape = Number(day?.st2?.yape || 0);
    const totalCash = st1Cash + st2Cash;
    const totalYape = st1Yape + st2Yape;
    rows.push([
      day.day,
      st1Cash,
      st1Yape,
      st2Cash,
      st2Yape,
      totalCash,
      totalYape,
      totalCash + totalYape,
      totalCash + totalYape
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${year}-${String(month).padStart(2, '0')}`);
  XLSX.writeFile(wb, `diario-${year}-${String(month).padStart(2, '0')}.xlsx`);
}
