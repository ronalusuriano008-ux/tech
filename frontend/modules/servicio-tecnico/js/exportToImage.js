export async function exportToImage(year, month, days) {
  if (typeof html2canvas === 'undefined') {
    throw new Error('La librería html2canvas no está cargada');
  }

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthName = monthNames[month - 1] || '';
  const sortedDays = Array.isArray(days) ? [...days].sort((a, b) => Number(a.day) - Number(b.day)) : [];

  const rows = sortedDays.map((day) => {
    const st1Cash = Number(day?.st1?.cash || 0);
    const st1Yape = Number(day?.st1?.yape || 0);
    const st2Cash = Number(day?.st2?.cash || 0);
    const st2Yape = Number(day?.st2?.yape || 0);
    const total = st1Cash + st1Yape + st2Cash + st2Yape;
    return `
      <tr>
        <td style="border:1px solid #d1d5db; padding:8px; text-align:left;">${day.day}</td>
        <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">S/. ${st1Cash.toFixed(2)}</td>
        <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">S/. ${st1Yape.toFixed(2)}</td>
        <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">S/. ${st2Cash.toFixed(2)}</td>
        <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">S/. ${st2Yape.toFixed(2)}</td>
        <td style="border:1px solid #d1d5db; padding:8px; text-align:right;">S/. ${total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '1200px';
  container.style.padding = '24px';
  container.style.backgroundColor = '#f8fafc';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Arial, sans-serif';

  container.innerHTML = `
    <div style="width:100%; padding: 24px; background: #f8fafc; color: #0f172a;">
      <h1 style="margin:0 0 12px; font-size: 28px;">Diario - ${monthName} ${year}</h1>
      <table style="width:100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:left;">Día</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">ST1 Efectivo</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">ST1 Yape</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">ST2 Efectivo</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">ST2 Yape</th>
            <th style="border:1px solid #d1d5db; padding:8px; text-align:right;">Total</th>
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
    link.download = `diario-${year}-${String(month).padStart(2, '0')}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    document.body.removeChild(container);
  }
}
