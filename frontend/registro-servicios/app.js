// frontend/registro-servicios/app.js
const API = window.AppConfig?.apiBaseUrl || '/api';
const reportOrigin = new URL(window.AppConfig?.apiBaseUrl || 'https://api.vixbox.xyz/api', window.location.href).origin;

const readUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch (error) {
        return null;
    }
};

const user = readUser();

if (!user) {
    window.location.href = window.AppConfig?.loginPath || '/login/index.html';
}

const headers = user ? {
    'Content-Type': 'application/json',
    'x-user-id': user.id,
    'x-user-role': user.role
} : { 'Content-Type': 'application/json' };

document.getElementById('userName').textContent =
    `BIENVENIDO, ${user?.nombre || 'USUARIO'}.`;

document.getElementById('filterFecha').value = new Date()
    .toLocaleDateString('en-CA', {
        timeZone: 'America/Lima'
    });

const getFecha = () =>
    document.getElementById('filterFecha').value;

// ===============================
// UTILIDADES
// ===============================
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
};

const autoResizeTextarea = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
};

// ===============================
// SERVICIOS
// ===============================
const loadServicios = async () => {
    const res = await fetch(`${API}/servicios?fecha=${getFecha()}`, { headers });
    const servicios = await res.json();

    const tbody = document.querySelector('#serviciosTable tbody');
    tbody.innerHTML = servicios.map(s => `
        <tr>
            <td>${s.hora || new Date(s.fechaRegistro).toLocaleTimeString()}</td>
            <td>${s.servicio}</td>
            <td>${s.modelo}</td>
            <td>S/.${s.precio.toFixed(2)}</td>
            <td>S/.${s.costo.toFixed(2)}</td>
            <td>S/.${s.utilidad.toFixed(2)}</td>
            <td>
                <button class="btn-table" onclick="deleteServicio('${s.id}')">
                    <i class="bi bi-trash3"></i>
                </button>
            </td>
        </tr>
    `).join('');

    const ing = servicios.reduce((s, i) => s + i.precio, 0);
    const cos = servicios.reduce((s, i) => s + i.costo, 0);
    document.getElementById('resIngresos').textContent = `S/.${ing.toFixed(2)}`;
    document.getElementById('resCostos').textContent = `S/.${cos.toFixed(2)}`;
    document.getElementById('resUtilidad').textContent = `S/.${(ing - cos).toFixed(2)}`;
};

document.getElementById('servicioForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const precio = parseFloat(document.getElementById('s-precio').value);
    const costo = parseFloat(document.getElementById('s-costo').value);

    const body = {
        servicio: document.getElementById('s-servicio').value,
        modelo: document.getElementById('s-modelo').value,
        precio,
        costo,
        utilidad: Math.round((precio - costo) * 100) / 100,
        fecha: getFecha()
    };

    await fetch(`${API}/servicios`, { method: 'POST', headers, body: JSON.stringify(body) });
    e.target.reset();
    loadServicios();
});

const deleteServicio = async (id) => {
    if (confirm('¿Eliminar este servicio?')) {
        await fetch(`${API}/servicios/${id}`, { method: 'DELETE', headers });
        loadServicios();
    }
};

// ===============================
// REPORTE
// ===============================
const descargarReporte = async () => {
    try {
        const btnReporte = document.querySelector('[onclick="descargarReporte()"]');
        const textoOriginal = btnReporte.innerHTML;
        btnReporte.innerHTML = '<i class="bi bi-hourglass-split"></i> Generando...';
        btnReporte.disabled = true;

        const res = await fetch(`${API}/reportes/diario`, { headers });
        if (!res.ok) throw new Error('Error al generar reporte');
        const data = await res.json();

        const container = document.getElementById('reporte-render-container');

        let serviciosHTML = data.servicios.map(s => `
            <tr>
                <td>${s.hora || '--:--'}</td>
                <td>${s.servicio} (${s.modelo})</td>
                <td style="text-align:right">S/.${s.precio.toFixed(2)}</td>
                <td style="text-align:right">S/.${s.costo.toFixed(2)}</td>
                <td style="text-align:right">S/.${s.utilidad.toFixed(2)}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="report-img-wrapper" style="background:#ffffff; color:#000000; padding:20px; font-family:Arial;">
                <h2 style="color:#000000;">
                    <i class="bi bi-file-earmark-text"></i> Reporte Diario
                </h2>
                <div class="report-img-header" style="display:flex; justify-content:space-between; color:#000000;">
                    <div><span>Técnico:</span><br><strong>${data.tecnico.toUpperCase()}</strong></div>
                    <div style="text-align:right"><span>Fecha:</span><br><strong>${data.fecha}</strong></div>
                </div>
                <table class="report-img-table" style="width:100%; border-collapse:collapse; margin-top:10px;">
                    <thead>
                        <tr style="background:#ffffff; color:#000000;">
                            <th style="border:1px solid #000000; padding:8px;">Hora</th>
                            <th style="border:1px solid #000000; padding:8px;">Servicio</th>
                            <th style="border:1px solid #000000; padding:8px;">Precio</th>
                            <th style="border:1px solid #000000; padding:8px;">Costo</th>
                            <th style="border:1px solid #000000; padding:8px;">Utilidad</th>
                        </tr>
                    </thead>
                    <tbody>${serviciosHTML}</tbody>
                </table>
                <div class="report-img-totals" style="margin-top:15px; color:#000000;">
                    <div class="report-img-row" style="display:flex; justify-content:space-between;">
                        <span>Ingresos (${data.cantidadServicios} srv):</span>
                        <span style="color:#000000; font-weight:bold;">S/.${data.totalIngresos.toFixed(2)}</span>
                    </div>
                    <div class="report-img-row" style="display:flex; justify-content:space-between;">
                        <span>Costos:</span>
                        <span style="color:#000000; font-weight:bold;">S/.${data.totalCostos.toFixed(2)}</span>
                    </div>
                    <div class="report-img-row report-img-total-final" style="display:flex; justify-content:space-between; font-size:18px;">
                        <span>Utilidad:</span>
                        <span style="color:#000000; font-weight:bold;">S/.${data.utilidadTotal.toFixed(2)}</span>
                    </div>
                    <div class="report-img-row" style="display:flex; justify-content:space-between;">
                        <span>Distribucion de utilidad:</span>
                        <span style="color:#000000; font-weight:bold;">S/.${(data.utilidadTotal / 2).toFixed(2)}</span>
                    </div>
                </div>
                <footer style="margin-top:2px; font-size:8px; color:#000000; text-align:center;">
                    <span>Reporte autogenerado desde <a style="color: #5f0692; text-decoration:underline;" href="${reportOrigin}" target="_blank">${reportOrigin}</a> - ${new Date().toLocaleString()}</span>
                </footer>
            </div>`;

        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(
            
            container.querySelector('.report-img-wrapper'),
            {
                backgroundColor: '#ffffff',
                scale: 3,
                useCORS: true
            }
        );

        const link = document.createElement('a');
        link.download = `reporte_${data.fecha}_${data.tecnico.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        container.innerHTML = '';
        btnReporte.innerHTML = textoOriginal;
        btnReporte.disabled = false;

    } catch (error) {
        alert('Error al generar imagen: ' + error.message);
    }
};

// ===============================
// LOGOUT
// ===============================
const logout = () => {
    localStorage.removeItem('user');
    window.location.href = window.AppConfig?.loginPath || '/login/index.html';
};

// ===============================
// INICIO
// ===============================
loadServicios();