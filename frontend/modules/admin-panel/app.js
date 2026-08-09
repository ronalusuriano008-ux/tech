// frontend/admin-panel/app.js
const API = window.AppConfig?.apiBaseUrl || '/api';
const loginPath = window.AppConfig?.loginPath || '/login/index.html';

const readUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch (error) {
        return null;
    }
};
let user = readUser();

const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(user ? {
        'x-user-id': user.id,
        'x-user-role': user.role
    } : {})
});

const checkSession = async () => {
    try {
        const res = await fetch(`${API}/auth/check`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.logged) throw new Error('No autenticado');

        user = data.user;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    } catch (err) {
        localStorage.removeItem('user');
        window.redirectTo?.(loginPath, { replace: true });
        return null;
    }
};

const start = async () => {
    const sessionUser = await checkSession();
    if (!sessionUser) return;
    loadAll();
};

start();

const notify = (type, message, options = {}) => {
    if (window.AppMessages?.[type]) {
        window.AppMessages[type](message, options);
    }
};

const parseResponseError = async (res, fallback) => {
    const payload = await res.json().catch(() => ({}));
    const error = new Error(payload.message || payload.error || fallback || 'No se pudo completar la solicitud');
    error.status = res.status;
    throw error;
};

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

// ===============================
// NAVEGACIÓN
// ===============================
const showSection = (id) => {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(`sec-${id}`).style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${id}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Cargar datos específicos de la sección
    if (id === 'reportes') {
        loadReportesSection();
    }
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
    try {
        const [metricsRes, usersRes] = await Promise.all([
            fetch(`${API}/servicios/metrics?fecha=${getFecha()}`, { headers: getHeaders(), credentials: 'include' }),
            fetch(`${API}/users`, { headers: getHeaders(), credentials: 'include' })
        ]);

        if (!metricsRes.ok) await parseResponseError(metricsRes, 'No se pudieron cargar las métricas');
        if (!usersRes.ok) await parseResponseError(usersRes, 'No se pudieron cargar los usuarios');

        const data = await metricsRes.json();
        const users = await usersRes.json();
        const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));

        document.getElementById('metricsContent').innerHTML = `
            <div class="metric-card"><h4>Ingresos</h4><p class="money-positive">S/.${data.totalIngresos}</p></div>
            <div class="metric-card"><h4>Costos</h4><p class="money-negative">S/.${data.totalCostos}</p></div>
            <div class="metric-card"><h4>Gastos</h4><p class="money-negative">S/.${data.totalGastos || 0}</p></div>
            <div class="metric-card"><h4>Utilidad Bruta</h4><p class="${data.utilidadBruta < 0 ? 'money-negative' : 'money-positive'}">S/.${data.utilidadBruta}</p></div>
            <div class="metric-card"><h4>Utilidad Neta</h4><p class="${data.utilidadNeta < 0 ? 'money-negative' : 'money-positive'}">S/.${data.utilidadNeta}</p></div>
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
    } catch (error) {
        console.error('[admin-panel] Error cargando metricas:', error);
        document.getElementById('metricsContent').innerHTML = '<p class="app-message-inline is-error">No se pudieron cargar las métricas.</p>';
        window.AppMessages?.networkError(error, { title: 'Métricas no disponibles' });
    }
};

// ===============================
// USUARIOS Y ROLES
// ===============================
let editingUserId = null;
let loadedUsers = [];
const userForm = document.getElementById('userForm');
const passwordInput = document.getElementById('u-password');

function resetUserForm() {
    editingUserId = null;
    userForm.reset();
    passwordInput.required = true;
    passwordInput.placeholder = 'Contraseña';
    document.getElementById('userFormTitle').innerHTML = '<i class="bi bi-person-plus-fill"></i> Agregar usuario';
    document.getElementById('userSubmitBtn').innerHTML = '<i class="bi bi-save"></i> Registrar usuario';
    document.getElementById('cancelUserEdit').hidden = true;
}

const loadUsers = async () => {
    try {
        const res = await fetch(`${API}/users`, { headers: getHeaders(), credentials: 'include' });
        if (!res.ok) await parseResponseError(res, 'No se pudieron cargar los usuarios');
        const users = await res.json();
        loadedUsers = users;
        document.getElementById('adminCount').textContent = users.filter(u => u.role === 'ADMIN').length;
        document.getElementById('techCount').textContent = users.filter(u => u.role === 'TECNICO').length;
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${escapeHtml(u.nombre)}</td><td>${escapeHtml(u.usuario)}</td>
                <td><span class="status-badge ${u.role === 'ADMIN' ? 'money-positive' : ''}">${u.role === 'ADMIN' ? 'Administrador' : 'Técnico'}</span></td>
                <td>
                    <button class="btn-table" title="Editar usuario" onclick="editUser('${u.id}')"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn-table" title="Eliminar usuario" onclick="deleteUser('${u.id}')"><i class="bi bi-trash3"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('[admin-panel] Error cargando usuarios:', error);
        document.querySelector('#usersTable tbody').innerHTML = `
            <tr><td colspan="4"><div class="app-message-inline is-error">No se pudieron cargar los usuarios.</div></td></tr>
        `;
        window.AppMessages?.networkError(error, { title: 'Usuarios no disponibles' });
    }
};

userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        nombre: document.getElementById('u-nombre').value,
        usuario: document.getElementById('u-usuario').value,
        password: passwordInput.value,
        role: document.getElementById('u-role').value,
        diasDescanso: []
    };
    if (editingUserId && !body.password) delete body.password;
    try {
        const isEditing = Boolean(editingUserId);
        const res = await fetch(`${API}/users${isEditing ? `/${editingUserId}` : ''}`, { method: isEditing ? 'PUT' : 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify(body) });
        if (!res.ok) await parseResponseError(res, `No se pudo ${isEditing ? 'actualizar' : 'crear'} el usuario`);
        resetUserForm();
        notify('success', isEditing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        loadUsers();
    } catch (error) {
        console.error('[admin-panel] Error creando usuario:', error);
        window.AppMessages?.networkError(error, { title: 'No se pudo crear' });
    }
});

window.editUser = (id) => {
    const selected = loadedUsers.find(u => u.id === id);
    if (!selected) return;
    editingUserId = id;
    document.getElementById('u-nombre').value = selected.nombre || '';
    document.getElementById('u-usuario').value = selected.usuario || '';
    document.getElementById('u-role').value = selected.role || 'TECNICO';
    passwordInput.value = '';
    passwordInput.required = false;
    passwordInput.placeholder = 'Contraseña (dejar vacía para conservarla)';
    document.getElementById('userFormTitle').innerHTML = '<i class="bi bi-pencil-square"></i> Editar usuario';
    document.getElementById('userSubmitBtn').innerHTML = '<i class="bi bi-save"></i> Guardar cambios';
    document.getElementById('cancelUserEdit').hidden = false;
    userForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
document.getElementById('cancelUserEdit').addEventListener('click', resetUserForm);

const deleteUser = async (id) => {
    if (confirm('¿Eliminar este usuario?')) {
        try {
            const res = await fetch(`${API}/users/${id}`, { method: 'DELETE', headers: getHeaders(), credentials: 'include' });
            if (!res.ok) await parseResponseError(res, 'No se pudo eliminar el usuario');
            notify('success', 'Usuario eliminado');
            loadUsers();
        } catch (error) {
            console.error('[admin-panel] Error eliminando usuario:', error);
            window.AppMessages?.networkError(error, { title: 'No se pudo eliminar' });
        }
    }
};

// ===============================
// CONFIGURACIÓN
// ===============================
const loadConfig = async () => {
    try {
        const res = await fetch(`${API}/config`, { headers: getHeaders(), credentials: 'include' });
        if (!res.ok) await parseResponseError(res, 'No se pudo cargar la configuración');
        const c = await res.json();
        document.getElementById('c-vh').value = c.vh;
        document.getElementById('c-cf').value = c.cf;
        document.getElementById('c-margen').value = c.margen;
        document.getElementById('c-riesgo').value = c.riesgo;
        document.getElementById('c-garantia').value = c.garantia;
    } catch (error) {
        console.error('[admin-panel] Error cargando configuracion:', error);
        window.AppMessages?.networkError(error, { title: 'Configuración no disponible' });
    }
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
    try {
        const res = await fetch(`${API}/config`, { method: 'PUT', headers: getHeaders(), credentials: 'include', body: JSON.stringify(body) });
        if (!res.ok) await parseResponseError(res, 'No se pudo guardar la configuración');
        notify('success', 'Configuración guardada correctamente');
    } catch (error) {
        console.error('[admin-panel] Error guardando configuracion:', error);
        window.AppMessages?.networkError(error, { title: 'No se pudo guardar' });
    }
});

// ===============================
// BACKUP / RESTORE DATABASE
// ===============================
const descargarBackup = async () => {
    try {
        const res = await fetch(`${API}/backup/export`, { headers: getHeaders(), credentials: 'include' });
        if (!res.ok) await parseResponseError(res, 'No se pudo descargar el backup');
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
        notify('success', 'Backup descargado correctamente');
    } catch (error) {
        window.AppMessages?.networkError(error, { title: 'Error al descargar backup' });
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

        const res = await fetch(`${API}/backup/import`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify(backupData)
        });
        if (!res.ok) await parseResponseError(res, 'No se pudo restaurar el backup');

        notify('success', 'Backup restaurado correctamente');
        loadAll();
        event.target.value = '';
    } catch (error) {
        window.AppMessages?.networkError(error, {
            title: 'No se pudo restaurar',
            fallback: error instanceof SyntaxError ? 'El archivo seleccionado no tiene un formato JSON válido.' : undefined
        });
        console.error(error);
    }
};

// ===============================
// REPORTES DE TÉCNICOS
// ===============================
const loadReportesSection = async () => {
    try {
        const res = await fetch(`${API}/users`, { headers: getHeaders(), credentials: 'include' });
        if (!res.ok) await parseResponseError(res, 'No se pudieron cargar los técnicos');
        const users = await res.json();
        
        const technicosSelect = document.getElementById('r-tecnico');
        const tecnicos = users.filter(u => u.role === 'TECNICO');
        
        // Limpiar opciones previas excepto la primera
        while (technicosSelect.options.length > 1) {
            technicosSelect.remove(1);
        }
        
        // Agregar técnicos al selector
        tecnicos.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.nombre;
            technicosSelect.appendChild(option);
        });
        
        // Establecer fecha actual por defecto
        const today = getFechaLima();
        document.getElementById('r-fecha').value = today;
        
    } catch (error) {
        console.error('[admin-panel] Error cargando técnicos para reportes:', error);
        window.AppMessages?.networkError(error, { title: 'No se pudieron cargar los técnicos' });
    }
};

const descargarReporteJSON = async () => {
    const tecnicoId = document.getElementById('r-tecnico').value;
    const fecha = document.getElementById('r-fecha').value;
    
    if (!tecnicoId) {
        notify('error', 'Por favor selecciona un técnico');
        return;
    }
    
    if (!fecha) {
        notify('error', 'Por favor selecciona una fecha');
        return;
    }
    
    try {
        const url = `${API}/reportes/diario?tecnicoId=${tecnicoId}&fecha=${fecha}`;
        const res = await fetch(url, { headers: getHeaders(), credentials: 'include' });
        
        if (!res.ok) await parseResponseError(res, 'No se pudo generar el reporte');
        
        const reporte = await res.json();
        const blob = new Blob([JSON.stringify(reporte, null, 2)], { type: 'application/json' });
        const urlBlob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = `reporte_${reporte.tecnico}_${reporte.fecha}.json`;
        a.click();
        window.URL.revokeObjectURL(urlBlob);
        
        notify('success', 'Reporte JSON descargado correctamente');
    } catch (error) {
        console.error('[admin-panel] Error descargando reporte JSON:', error);
        window.AppMessages?.networkError(error, { title: 'Error al descargar reporte' });
    }
};

const descargarReporteImagen = async () => {
    const tecnicoId = document.getElementById('r-tecnico').value;
    const fecha = document.getElementById('r-fecha').value;
    
    if (!tecnicoId) {
        notify('error', 'Por favor selecciona un técnico');
        return;
    }
    
    if (!fecha) {
        notify('error', 'Por favor selecciona una fecha');
        return;
    }
    
    try {
        const url = `${API}/reportes/imagen?tecnicoId=${tecnicoId}&fecha=${fecha}`;
        const res = await fetch(url, { headers: getHeaders(), credentials: 'include' });
        
        if (!res.ok) await parseResponseError(res, 'No se pudo generar la imagen del reporte');
        
        const blob = await res.blob();
        const urlBlob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = `reporte_${new Date().toISOString().slice(0, 10)}.jpg`;
        a.click();
        window.URL.revokeObjectURL(urlBlob);
        
        notify('success', 'Reporte imagen descargado correctamente');
    } catch (error) {
        console.error('[admin-panel] Error descargando reporte imagen:', error);
        window.AppMessages?.networkError(error, { title: 'Error al descargar reporte' });
    }
};

// ===============================
// LOGOUT
// ===============================
const logout = async () => {
    try {
        await fetch(`${API}/auth/logout`, { method: 'POST', headers: getHeaders(), credentials: 'include' });
    } catch (error) {
        console.warn('[admin-panel] No se pudo cerrar la sesion en servidor:', error);
    } finally {
        localStorage.removeItem('user');
        window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
    }
};

// ===============================
// INICIO
// ===============================
// El inicio ahora espera a validar sesión antes de cargar datos protegidos.
