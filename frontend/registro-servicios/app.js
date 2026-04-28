// frontend/registro-servicios/app.js
const API = '/api';
const user = JSON.parse(localStorage.getItem('user'));
const headers = { 'Content-Type': 'application/json', 'x-user-id': user.id, 'x-user-role': user.role };

if (!user) window.location.href = '/login/index.html';

document.getElementById('userName').textContent = user.nombre;
document.getElementById('filterFecha').valueAsDate = new Date();

const getFecha = () => document.getElementById('filterFecha').value;

// Servicios
const loadServicios = async () => {
    const res = await fetch(`${API}/servicios?fecha=${getFecha()}`, { headers });
    const servicios = await res.json();
    
    const tbody = document.querySelector('#serviciosTable tbody');
    tbody.innerHTML = servicios.map(s => `
        <tr>
            <td>${new Date(s.fechaRegistro).toLocaleTimeString()}</td>
            <td>${s.servicio}</td>
            <td>${s.modelo}</td>
            <td>$${s.precio}</td>
            <td>$${s.costo}</td>
            <td>$${s.utilidad}</td>
            <td>
                <button onclick="deleteServicio('${s.id}')">🗑</button>
            </td>
        </tr>
    `).join('');

    // Resumen
    const ing = servicios.reduce((s, i) => s + i.precio, 0);
    const cos = servicios.reduce((s, i) => s + i.costo, 0);
    document.getElementById('resIngresos').textContent = `$${ing}`;
    document.getElementById('resCostos').textContent = `$${cos}`;
    document.getElementById('resUtilidad').textContent = `$${ing - cos}`;
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
        fecha: getFecha(),
        hora: new Date().toTimeString().substring(0, 5)
    };

    await fetch(`${API}/servicios`, { method: 'POST', headers, body: JSON.stringify(body) });
    e.target.reset();
    loadServicios();
});

const deleteServicio = async (id) => {
    if(confirm('¿Eliminar este servicio?')) {
        await fetch(`${API}/servicios/${id}`, { method: 'DELETE', headers });
        loadServicios();
    }
};

// Asistencia
const loadAsistenciaStatus = async () => {
    const res = await fetch(`${API}/asistencia?fecha=${getFecha()}`, { headers });
    const asist = await res.json();
    const el = document.getElementById('asistenciaStatus');
    const hoy = asist.find(a => a.usuarioId === user.id);
    
    if (hoy) {
        el.innerHTML = `<span style="color:green">Entrada: ${hoy.horaEntrada} | Salida: ${hoy.horaSalida || 'Pendiente'}</span>`;
        if(hoy.alertas) el.innerHTML += ` <span style="color:red">(!) ${hoy.alertas.join(', ')}</span>`;
    } else {
        el.innerHTML = `<span style="color:gray">No hay registro de asistencia hoy</span>`;
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

// Reporte
const descargarReporte = () => {
    window.location.href = `${API}/reportes/diario`;
};

// Mensajes
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