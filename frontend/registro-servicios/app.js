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
    window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
}

const headers = user ? {
    'Content-Type': 'application/json',
    'x-user-id': user.id,
    'x-user-role': user.role
} : { 'Content-Type': 'application/json' };

const parseResponseError = async (res, fallback) => {
    const payload = await res.json().catch(() => ({}));
    const error = new Error(payload.message || payload.error || fallback || 'No se pudo completar la solicitud');
    error.status = res.status;
    throw error;
};

document.getElementById('userName').textContent =
    `BIENVENIDO, ${user?.nombre || 'USUARIO'}.`;

document.getElementById('filterFecha').value = new Date()
    .toLocaleDateString('en-CA', {
        timeZone: 'America/Lima'
    });

const getFecha = () => {
    const value = document.getElementById('filterFecha').value;
    return value || new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Lima'
    });
};

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
    try {
        const fecha = getFecha();
        const res = await fetch(`${API}/servicios?fecha=${encodeURIComponent(fecha)}`, { headers });
        if (!res.ok) await parseResponseError(res, 'No se pudieron obtener los servicios');

        const payload = await res.json().catch(() => []);
        const servicios = Array.isArray(payload) ? payload : (payload.servicios || []);

        const tbody = document.querySelector('#serviciosTable tbody');
        if (!servicios.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; color:#9ca3af; padding:1rem;">
                        No hay servicios registrados para esta fecha.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = servicios.map(s => `
                <tr>
                    <td>${s.hora || (s.fechaRegistro ? new Date(s.fechaRegistro).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--')}</td>
                    <td>${escapeHtml(s.servicio || '-')}</td>
                    <td>${escapeHtml(s.modelo || '-')}</td>
                    <td>S/.${Number(s.precio || 0).toFixed(2)}</td>
                    <td>S/.${Number(s.costo || 0).toFixed(2)}</td>
                    <td>S/.${Number(s.utilidad || 0).toFixed(2)}</td>
                    <td>
                        <button class="btn-table" onclick="deleteServicio('${s.id}')">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        const ing = servicios.reduce((sum, item) => sum + Number(item.precio || 0), 0);
        const cos = servicios.reduce((sum, item) => sum + Number(item.costo || 0), 0);
        document.getElementById('resIngresos').textContent = `S/.${ing.toFixed(2)}`;
        document.getElementById('resCostos').textContent = `S/.${cos.toFixed(2)}`;
        document.getElementById('resUtilidad').textContent = `S/.${(ing - cos).toFixed(2)}`;
    } catch (error) {
        console.error('[registro-servicios] Error cargando servicios:', error);
        const tbody = document.querySelector('#serviciosTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color:#f87171; padding:1rem;">
                    No se pudieron cargar los servicios.
                </td>
            </tr>
        `;
        document.getElementById('resIngresos').textContent = 'S/.0.00';
        document.getElementById('resCostos').textContent = 'S/.0.00';
        document.getElementById('resUtilidad').textContent = 'S/.0.00';
        window.AppMessages?.networkError(error, { title: 'Servicios no disponibles' });
    }
};

document.getElementById('servicioForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const precio = parseFloat(document.getElementById('s-precio').value);
    const costo = parseFloat(document.getElementById('s-costo').value);

    const body = {
        servicio: document.getElementById('s-servicio').value.trim(),
        modelo: document.getElementById('s-modelo').value.trim(),
        precio,
        costo,
        utilidad: Math.round((precio - costo) * 100) / 100,
        fecha: getFecha()
    };

    try {
        const res = await fetch(`${API}/servicios`, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!res.ok) await parseResponseError(res, 'No se pudo registrar el servicio');
        e.target.reset();
        await loadServicios();
        window.AppMessages?.success('Servicio registrado correctamente');
    } catch (error) {
        console.error('[registro-servicios] Error registrando servicio:', error);
        window.AppMessages?.networkError(error, { title: 'No se pudo guardar' });
    }
});

const deleteServicio = async (id) => {
    if (confirm('¿Eliminar este servicio?')) {
        try {
            const res = await fetch(`${API}/servicios/${id}`, { method: 'DELETE', headers });
            if (!res.ok) await parseResponseError(res, 'No se pudo eliminar el servicio');
            window.AppMessages?.success('Servicio eliminado');
            loadServicios();
        } catch (error) {
            console.error('[registro-servicios] Error eliminando servicio:', error);
            window.AppMessages?.networkError(error, { title: 'No se pudo eliminar' });
        }
    }
};

// ===============================
// REPORTE
// ===============================
const descargarReporte = async () => {
    const btnReporte = document.querySelector('[onclick="descargarReporte()"]');
    const textoOriginal = btnReporte?.innerHTML;

    try {
        if (btnReporte) {
            btnReporte.innerHTML = '<i class="bi bi-hourglass-split"></i> Generando...';
            btnReporte.disabled = true;
        }

        const res = await fetch(`${API}/reportes/imagen?fecha=${encodeURIComponent(getFecha())}`, { headers });

        if (!res.ok) await parseResponseError(res, 'No se pudo generar el reporte');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `reporte_${getFecha()}.jpg`;
        link.href = url;
        link.click();

        window.URL.revokeObjectURL(url);
        window.AppMessages?.success('Reporte descargado correctamente');

    } catch (error) {
        window.AppMessages?.networkError(error, { title: 'Error al generar imagen' });
    } finally {
        if (btnReporte) {
            btnReporte.disabled = false;
            btnReporte.innerHTML = textoOriginal || '<i class="bi bi-file-earmark-bar-graph"></i> Descargar<br>Reporte';
        }
    }
};

// ===============================
// LOGOUT
// ===============================
const logout = async () => {
    try {
        await fetch(`${API}/auth/logout`, { method: 'POST', headers, credentials: 'include' });
    } catch (error) {
        console.warn('[registro-servicios] No se pudo cerrar la sesion en servidor:', error);
    } finally {
        localStorage.removeItem('user');
        window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
    }
};

document.getElementById('filterFecha').addEventListener('change', () => {
    loadServicios();
});

// ===============================
// INICIO
// ===============================
loadServicios();
