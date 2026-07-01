// frontend/admin-panel/app.js
const API = window.AppConfig?.apiBaseUrl || '/api';
const readUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch (error) {
        return null;
    }
};
const user = readUser();

if (!user || user.role !== 'ADMIN') {
    window.location.href = window.AppConfig?.loginPath || '/login/index.html';
}

const headers = user ? {
    'Content-Type': 'application/json',
    'x-user-id': user.id,
    'x-user-role': user.role
} : { 'Content-Type': 'application/json' };

// ===============================
// FECHA DE LIMA - FUNCIÓN CORREGIDA
// ===============================
const getFechaLima = () => {
    const ahora = new Date();

    const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

    return formatter.format(ahora);
};

// Establecer fecha inicial del filtro
document.getElementById('filterFecha').value = getFechaLima();

const getFecha = () => document.getElementById('filterFecha').value;

console.log('Fecha filtro admin (Lima):', getFecha());

// ===============================
// NAVEGACIÓN
// ===============================
const showSection = (id) => {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(`sec-${id}`).style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${id}`);
    if (activeBtn) activeBtn.classList.add('active');

};

const loadAll = () => {
    loadMetrics();
    loadUsers();
    loadConfig();
};

// ===============================
// UTILIDADES GLOBALES
// ===============================
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Lima'
    });
};

const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Comparar solo la fecha (sin hora) en zona Lima
    const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    const msgDateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    if (msgDateStr === todayStr) return 'Hoy';
    if (msgDateStr === yesterdayStr) return 'Ayer';
    return d.toLocaleDateString('es-PE', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        timeZone: 'America/Lima'
    });
};

// ===============================
// MÉTRICAS
// ===============================
const loadMetrics = async () => {
    const [metricsRes, usersRes] = await Promise.all([
        fetch(`${API}/servicios/metrics?fecha=${getFecha()}`, { headers }),
        fetch(`${API}/users`, { headers })
    ]);

    const data = await metricsRes.json();
    const users = await usersRes.json();
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));

    document.getElementById('metricsContent').innerHTML = `
        <div class="metric-card"><h4>Ingresos</h4><p>S/.${data.totalIngresos}</p></div>
        <div class="metric-card"><h4>Costos</h4><p>S/.${data.totalCostos}</p></div>
        <div class="metric-card"><h4>Utilidad</h4><p>S/.${data.utilidad}</p></div>
        <div class="metric-card"><h4>Servicios</h4><p>${data.totalServicios}</p></div>
    `;

    document.getElementById('techMetrics').innerHTML = Object.entries(data.serviciosPorTecnico || {})
        .sort((a, b) => b[1].utilidad - a[1].utilidad)
        .map(([id, val], index) => {
            const nombre = userMap[id] || 'Desconocido';
            return `
                <li class="tech-card">
                    <div class="tech-rank">#${index + 1}</div>
                    <div class="tech-info">
                        <span class="tech-name">${nombre}</span>
                        <span class="tech-services">${val.count} servicios</span>
                    </div>
                    <div class="tech-profit">S/.${val.utilidad}</div>
                </li>`;
        })
        .join('');
};

// ===============================
// USUARIOS / TÉCNICOS
// ===============================
const loadUsers = async () => {
    const res = await fetch(`${API}/users`, { headers });
    const users = await res.json();
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = users.filter(u => u.role === 'TECNICO').map(u => `
        <tr>
            <td>${u.nombre}</td><td>${u.usuario}</td>
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
        diasDescanso: []
    };
    await fetch(`${API}/users`, { method: 'POST', headers, body: JSON.stringify(body) });
    e.target.reset();
    loadUsers();
});

const deleteUser = async (id) => {
    if (confirm('¿Eliminar técnico?')) {
        await fetch(`${API}/users/${id}`, { method: 'DELETE', headers });
        loadUsers();
    }
};

// ===============================
// CONFIGURACIÓN
// ===============================
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

// ===============================
// BACKUP / RESTORE DATABASE
// ===============================
const descargarBackup = async () => {
    try {
        const res = await fetch(`${API}/backup/export`, { headers });
        const data = await res.json();

        const blob = new Blob(
            [JSON.stringify(data, null, 2)],
            { type: 'application/json' }
        );

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${getFechaLima()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error al descargar backup');
        console.error(error);
    }
};

const subirBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('Esto reemplazará toda la base de datos actual. ¿Continuar?')) {
        event.target.value = '';
        return;
    }

    try {
        const text = await file.text();
        const backupData = JSON.parse(text);

        await fetch(`${API}/backup/import`, {
            method: 'POST',
            headers,
            body: JSON.stringify(backupData)
        });

        alert('Backup restaurado correctamente');
        loadAll();
        event.target.value = '';
    } catch (error) {
        alert('Archivo inválido o error al restaurar');
        console.error(error);
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
loadAll();