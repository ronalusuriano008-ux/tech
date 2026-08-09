import { parseDecimal } from './calculations.js';

export function exportToExcel(year, month, days) {
  if (typeof XLSX === 'undefined') throw new Error('La librería XLSX no está cargada');

  const sheetRows = [
    [
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
    ]
  ];

  const sortedDays = Array.isArray(days) ? [...days].sort((a, b) => Number(a.day) - Number(b.day)) : [];

  sortedDays.forEach((day) => {
    sheetRows.push([
      day.day,
      parseDecimal(day.tienda1),
      parseDecimal(day.tienda2),
      parseDecimal(day.tienda3),
      parseDecimal(day.totalDiario),
      parseDecimal(day.bancoDepositado),
      parseDecimal(day.retiroTienda),
      parseDecimal(day.retiroBanco),
      parseDecimal(day.saldoBanco),
      parseDecimal(day.acumuladoTienda)
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${year}-${String(month).padStart(2, '0')}`);
  XLSX.writeFile(wb, `tienda-${year}-${String(month).padStart(2, '0')}.xlsx`);
}
