// frontend/admin-panel/app.js
const API = '/api';
const user = JSON.parse(localStorage.getItem('user'));
const headers = { 'Content-Type': 'application/json', 'x-user-id': user.id, 'x-user-role': user.role };

if (!user || user.role !== 'ADMIN') window.location.href = '/login/index.html';

document.getElementById('filterFecha').valueAsDate = new Date();

// Función modificada para agregar clase activa al nav
const showSection = (id) => {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(`sec-${id}`).style.display = 'block';
    
    // Quitar clase active de todos los botones
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    // Agregar clase active al boton correspondiente (evitando el de salir)
    const activeBtn = document.getElementById(`nav-${id}`);
    if(activeBtn) activeBtn.classList.add('active');

    if (id === 'mensajes') loadMensajes();
};

const getFecha = () => document.getElementById('filterFecha').value;

const loadAll = () => {
    loadMetrics();
    loadUsers();
    loadConfig();
    loadAsistencia();
};

// Metrics
const loadMetrics = async () => {
    const res = await fetch(`${API}/servicios/metrics?fecha=${getFecha()}`, { headers });
    const data = await res.json();
    
    document.getElementById('metricsContent').innerHTML = `
        <div class="metric-card"><h4>Ingresos</h4><p>$${data.totalIngresos}</p></div>
        <div class="metric-card"><h4>Costos</h4><p>$${data.totalCostos}</p></div>
        <div class="metric-card"><h4>Utilidad</h4><p>$${data.utilidad}</p></div>
        <div class="metric-card"><h4>Servicios</h4><p>${data.totalServicios}</p></div>
    `;
    
    document.getElementById('techMetrics').innerHTML = Object.entries(data.serviciosPorTecnico || {})
        .map(([id, val]) => `<li><span>Técnico ${id.substring(0,8)}...</span> <strong>${val.count} srv | Util: $${val.utilidad}</strong></li>`).join('');
};

// Users
const loadUsers = async () => {
    const res = await fetch(`${API}/users`, { headers });
    const users = await res.json();
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = users.filter(u => u.role === 'TECNICO').map(u => `
        <tr>
            <td>${u.nombre}</td><td>${u.usuario}</td>
            <td>${u.horarioEntrada} - ${u.horarioSalida}</td>
            <td><button class="btn-table" onclick="deleteUser('${u.id}')"><i class="bi bi-trash3"></i></button></td>
        </tr>
    `).join('');
};

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        nombre: document.getElementById('u-nombre').value,
        usuario: document.getElementById('u-usuario').value,
        password: document.getElementById('u-password').value,
        role: 'TECNICO',
        horarioEntrada: document.getElementById('u-entrada').value,
        horarioSalida: document.getElementById('u-salida').value,
        diasDescanso: []
    };
    await fetch(`${API}/users`, { method: 'POST', headers, body: JSON.stringify(body) });
    e.target.reset();
    loadUsers();
});

const deleteUser = async (id) => {
    if(confirm('¿Eliminar técnico?')) {
        await fetch(`${API}/users/${id}`, { method: 'DELETE', headers });
        loadUsers();
    }
};

// Config
const loadConfig = async () => {
    const res = await fetch(`${API}/config`, { headers });
    const c = await res.json();
    document.getElementById('c-vh').value = c.vh;
    document.getElementById('c-cf').value = c.cf;
    document.getElementById('c-margen').value = c.margen;
    document.getElementById('c-riesgo').value = c.riesgo;
    document.getElementById('c-garantia').value = c.garantia;
};

document.getElementById('configForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        vh: parseFloat(document.getElementById('c-vh').value),
        cf: parseFloat(document.getElementById('c-cf').value),
        margen: parseFloat(document.getElementById('c-margen').value),
        riesgo: parseFloat(document.getElementById('c-riesgo').value),
        garantia: parseFloat(document.getElementById('c-garantia').value)
    };
    await fetch(`${API}/config`, { method: 'PUT', headers, body: JSON.stringify(body) });
    alert('Configuración guardada');
});

// Asistencia
const loadAsistencia = async () => {
    const res = await fetch(`${API}/asistencia?fecha=${getFecha()}`, { headers });
    const asistencias = await res.json();
    const tbody = document.querySelector('#asistenciaTable tbody');
    tbody.innerHTML = asistencias.map(a => `
        <tr>
            <td>${a.usuarioId}</td><td>${a.horaEntrada}</td><td>${a.horaSalida || '-'}</td>
            <td style="color:#ff0050; font-size:0.8rem;">${(a.alertas || []).join(', ') || '-'}</td>
        </tr>
    `).join('');
};

// Mensajes
const loadMensajes = async () => {
    const res = await fetch(`${API}/mensajes`, { headers });
    const msgs = await res.json();
    document.getElementById('mensajesList').innerHTML = msgs.map(m => `
        <div class="msg ${m.leido ? '' : 'unread'}">
            <p>${m.contenido}</p>
            <small>De: ${m.de} - ${new Date(m.fechaRegistro).toLocaleString()}</small>
            <div class="msg-actions">
                ${!m.leido ? `<button class="btn-table-outline" onclick="marcarLeido('${m.id}')"><i class="bi bi-check2"></i> Leído</button>` : ''}
            </div>
        </div>
    `).join('');
};

const marcarLeido = async (id) => {
    await fetch(`${API}/mensajes/${id}/leido`, { method: 'PUT', headers });
    loadMensajes();
};

const logout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login/index.html';
};

loadAll();