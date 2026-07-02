export async function exportToImage(year, month, days) {
    if (typeof html2canvas === 'undefined') {
        throw new Error('La librería html2canvas no está cargada');
    }

    // 1. Crear un contenedor HTML oculto para diseñar la imagen
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '1200px';
    container.style.padding = '40px';
    container.style.fontFamily = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    container.style.backgroundColor = '#f8fafc';
    container.style.color = '#0f172a';

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const monthName = monthNames[month - 1];
    const daysInMonth = new Date(year, month, 0).getDate();

    let acumCash = 0;
    let acumYape = 0;

    // Helper para formatear PEN (evita importar módulo)
    const formatPEN = (v) => 'S/ ' + (Number(v) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let tableRows = '';
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

        const tieneDatos = totalCash > 0 || totalYape > 0;
        const rowClass = tieneDatos ? 'has-data' : 'no-data';

        tableRows += `
            <tr class="${rowClass}">
                <td class="day-col">${i}</td>
                <td>${formatPEN(st1Cash)}</td>
                <td>${formatPEN(st1Yape)}</td>
                <td>${formatPEN(st2Cash)}</td>
                <td>${formatPEN(st2Yape)}</td>
                <td class="total-col">${formatPEN(totalCash)}</td>
                <td class="total-col">${formatPEN(totalYape)}</td>
                <td class="acum-col">${formatPEN(acumCash)}</td>
                <td class="acum-col">${formatPEN(acumYape)}</td>
            </tr>
        `;
    }

    container.innerHTML = `
        <style>
            .header {
                background: linear-gradient(135deg, #1e293b 0%, #4c1d95 100%);
                color: white;
                padding: 25px 30px;
                border-radius: 12px 12px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: -2px;
            }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
            .header span { background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; font-weight: bold; }
            .table-wrapper {
                background: white;
                border: 1px solid #e2e8f0;
                border-top: none;
                border-radius: 0 0 12px 12px;
                padding: 20px;
                overflow: hidden;
            }
            table { width: 100%; border-collapse: collapse; font-size: 14px; text-align: center; }
            th { 
                background: #f1f5f9; 
                color: #475569; 
                padding: 12px 8px; 
                font-weight: 600; 
                border-bottom: 2px solid #e2e8f0;
                font-size: 12px;
                text-transform: uppercase;
            }
            td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            tr.no-data td { color: #cbd5e1; }
            tr.has-data td { font-weight: 600; color: #0f172a; background-color: #ffffff; }
            tr.has-data:hover { background-color: #f8fafc; }
            .day-col { font-weight: 800 !important; color: #64748b !important; }
            .total-col { color: #059669 !important; background-color: #ecfdf5 !important; font-weight: 700 !important; }
            .acum-col { color: #2563eb !important; background-color: #eff6ff !important; font-weight: 700 !important; }
            tr.no-data .total-col, tr.no-data .acum-col { background-color: #f8fafc !important; }
            .summary-container {
                display: flex;
                gap: 20px;
                margin-top: 24px;
            }
            .card {
                flex: 1;
                padding: 20px;
                border-radius: 12px;
                border-left: 6px solid;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            }
            .card-cash { background: #ecfdf5; border-color: #10b981; color: #065f46; }
            .card-yape { background: #f5f3ff; border-color: #8b5cf6; color: #5b21b6; }
            .card-total { 
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%); 
                border-color: #f59e0b; 
                color: white; 
                flex: 1.5;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
            }
            .card-label { font-size: 13px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }
            .card-value { font-size: 28px; font-weight: 800; }
            .card-total .card-value { font-size: 36px; color: #fbbf24; }
            .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
                padding-top: 15px;
            }
        </style>

        <div class="header">
            <h1>REPORTE DE INGRESOS</h1>
            <span>${monthName} ${year}</span>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Día</th>
                        <th>ST 1 Efectivo</th>
                        <th>ST 1 Yape</th>
                        <th>ST 2 Efectivo</th>
                        <th>ST 2 Yape</th>
                        <th>Total Efectivo</th>
                        <th>Total Yape</th>
                        <th>Acum. Efectivo</th>
                        <th>Acum. Yape</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>

        <div class="summary-container">
            <div class="card card-cash">
                <div class="card-label">Total Efectivo</div>
                <div class="card-value">${formatPEN(acumCash)}</div>
            </div>
            <div class="card card-yape">
                <div class="card-label">Total Yape</div>
                <div class="card-value">${formatPEN(acumYape)}</div>
            </div>
            <div class="card card-total">
                <div class="card-label">Gran Total</div>
                <div class="card-value">${formatPEN(acumCash + acumYape)}</div>
            </div>
        </div>

        <div class="footer">
            Panel de Control VixBox | Generado el ${new Date().toLocaleString('es-PE')}
        </div>
    `;

    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#f8fafc'
        });

        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Reporte_Ingresos_${year}_${monthName}.png`;
        link.href = imgData;
        link.click();

    } catch (error) {
        console.error('Error al generar la imagen:', error);
        throw error;
    } finally {
        document.body.removeChild(container);
    }
}
