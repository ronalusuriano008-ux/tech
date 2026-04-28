const API = '/api';
const user = JSON.parse(localStorage.getItem('user'));
const headers = { 'Content-Type': 'application/json', 'x-user-id': user.id, 'x-user-role': user.role };

if (!user) window.location.href = '/login/index.html';

document.getElementById('userName').textContent = `BIENVENIDO, ${user.nombre}.`;
document.getElementById('filterFecha').valueAsDate = new Date();

const getFecha = () => document.getElementById('filterFecha').value;

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
        pagoCliente: parseFloat(document.getElementById('s-pagoCliente').value) || 0,
        pagoProveedor: parseFloat(document.getElementById('s-pagoProveedor').value) || 0,
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

const loadAsistenciaStatus = async () => {
    const res = await fetch(`${API}/asistencia?fecha=${getFecha()}`, { headers });
    const asist = await res.json();
    const el = document.getElementById('asistenciaStatus');
    const hoy = asist.find(a => a.usuarioId === user.id);

    if (hoy) {
        el.innerHTML = `<span style="color:green"><i class="bi bi-clock-history"></i> ${hoy.horaEntrada} - ${hoy.horaSalida || 'Pendiente'}</span>`;
        if (hoy.alertas) el.innerHTML += ` <span style="color:red">(!) ${hoy.alertas.join(', ')}</span>`;
    } else {
        el.innerHTML = `<span style="color:gray"><i class="bi bi-dash-circle"></i> Sin registrar</span>`;
    }
};

const checkIn = async () => {
    await fetch(`${API}/asistencia/check-in`, { method: 'POST', headers });
    loadAsistenciaStatus();
};

const checkOut = async () => {
    try {
        await fetch(`${API}/asistencia/check-out`, { method: 'POST', headers });
        loadAsistenciaStatus();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

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
            </tr>
        `).join('');

        container.innerHTML = `
    <div class="report-img-wrapper" style="background:#ffffff; color:#000000; padding:20px; font-family:Arial;">
        <h2 style="color:#000;">
            <i class="bi bi-file-earmark-text"></i> Reporte Diario
        </h2>
        
        <div class="report-img-header" style="display:flex; justify-content:space-between; color:#000;">
            <div><span>Técnico:</span><br><strong>${data.tecnico}</strong></div>
            <div style="text-align:right"><span>Fecha:</span><br><strong>${data.fecha}</strong></div>
        </div>
        
        <table class="report-img-table" style="width:100%; border-collapse:collapse; margin-top:10px;">
            <thead>
                <tr style="background:#f0f0f0; color:#000;">
                    <th style="border:1px solid #ccc; padding:8px;">Hora</th>
                    <th style="border:1px solid #ccc; padding:8px;">Servicio</th>
                    <th style="border:1px solid #ccc; padding:8px;">Precio</th>
                </tr>
            </thead>
            <tbody>${serviciosHTML}</tbody>
        </table>

        <div class="report-img-totals" style="margin-top:15px; color:#000;">
            <div class="report-img-row" style="display:flex; justify-content:space-between;">
                <span>Ingresos (${data.cantidadServicios} srv):</span>
                <span style="color:#000; font-weight:bold;">S/.${data.totalIngresos.toFixed(2)}</span>
            </div>
            <div class="report-img-row" style="display:flex; justify-content:space-between;">
                <span>Costos:</span>
                <span style="color:#000; font-weight:bold;">S/.${data.totalCostos.toFixed(2)}</span>
            </div>
           <div class="report-img-row report-img-total-final" style="display:flex; justify-content:space-between; font-size:18px;">
    <span>Utilidad:</span>
    <span style="color:#000; font-weight:bold;">
        S/.${data.utilidadTotal.toFixed(2)}
    </span>
</div>

<div class="report-img-row" style="display:flex; justify-content:space-between;">
    <span>Distribuicion de utilidad:</span>
    <span style="color:#000; font-weight:bold;">
        S/.${(data.utilidadTotal / 2).toFixed(2)}
    </span>
</div>
        </div>
    </div>
`;

        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(container.querySelector('.report-img-wrapper'), {
            backgroundColor: null,
            scale: 2,
            useCORS: true
        });

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

document.getElementById('msgForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = { contenido: document.getElementById('msg-contenido').value };
    await fetch(`${API}/mensajes`, { method: 'POST', headers, body: JSON.stringify(body) });
    document.getElementById('msg-contenido').value = '';
    alert('Mensaje enviado');
});

const logout = () => { localStorage.removeItem('user'); window.location.href = '/login/index.html'; };

loadServicios();
loadAsistenciaStatus();