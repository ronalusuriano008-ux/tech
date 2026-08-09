import { formatCurrency, parseDecimal } from './calculations.js';

export async function exportToImage(year, month, days) {
  if (typeof html2canvas === 'undefined') {
    throw new Error('La librería html2canvas no está cargada');
  }

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const monthName = monthNames[month - 1] || '';
  const sortedDays = Array.isArray(days) ? [...days].sort((a, b) => Number(a.day) - Number(b.day)) : [];

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '1200px';
  container.style.padding = '24px';
  container.style.backgroundColor = '#f8fafc';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Arial, sans-serif';

  const rows = sortedDays.map((day) => `
    <tr>
      <td style="border:1px solid #d1d5db; padding:8px; text-align:left;">${day.day}</td>
      <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">${formatCurrency(parseDecimal(day.tienda1))}</td>
      <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">${formatCurrency(parseDecimal(day.tienda2))}</td>
      <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">${formatCurrency(parseDecimal(day.tienda3))}</td>
      <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">${formatCurrency(parseDecimal(day.totalDiario))}</td>
      <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">${formatCurrency(parseDecimal(day.bancoDepositado))}</td>
      <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">${formatCurrency(parseDecimal(day.retiroTienda))}</td>
      <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">${formatCurrency(parseDecimal(day.retiroBanco))}</td>
      <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">${formatCurrency(parseDecimal(day.saldoBanco))}</td>
      <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">${formatCurrency(parseDecimal(day.acumuladoTienda))}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div style="width:100%; padding: 24px; background: #f8fafc; color: #0f172a;">
      <h1 style="margin:0 0 12px; font-size: 28px;">Control Diario - ${monthName} ${year}</h1>
      <table style="width:100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:left;">Día</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Tienda 1</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Tienda 2</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Tienda 3</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Total Diario</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Banco Depositado</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Retiro Tienda</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Retiro Banco</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Saldo Banco</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Acumulado Tienda</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `tienda-${year}-${String(month).padStart(2, '0')}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    document.body.removeChild(container);
  }
}
