// frontend/registro-servicios/app.js
const API = window.AppConfig?.apiBaseUrl || '/api';
const reportOrigin = window.location.origin;

const readUser = () => {
    try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('[registro-servicios] Error leyendo usuario:', error);
        return null;
    }
};

let user = readUser();
const loginPath = window.AppConfig?.loginPath || '/login/index.html';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(user ? {
        'x-user-id': user.id,
        'x-user-role': user.role
    } : {})
});

const validateSession = async () => {
    try {
        // La sesión real es la cookie httpOnly: no depender de localStorage para entrar.
        // En modo offline sí se permite el último perfil previamente validado.
        if (!navigator.onLine) {
            const saved = await window.OfflineStore?.getMeta('session-profile');
            if (saved?.user) {
                user = saved.user;
                return true;
            }
            window.location.href = loginPath;
            return false;
        }
        const res = await fetch(`${API}/auth/check`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.logged) {
            localStorage.removeItem('user');
            user = null;
            window.location.href = loginPath;
            return false;
        }
        user = data.user;
        await window.OfflineStore?.putMeta('session-profile', { user, verifiedAt: Date.now() });
        localStorage.removeItem('user');
        return true;
    } catch (error) {
        const saved = await window.OfflineStore?.getMeta('session-profile');
        if (!navigator.onLine && saved?.user) {
            user = saved.user;
            return true;
        }
        localStorage.removeItem('user');
        user = null;
        window.location.href = loginPath;
        return false;
    }
};

const parseResponseError = async (res, fallback) => {
    const payload = await res.json().catch(() => ({}));
    const error = new Error(payload.message || payload.error || fallback || 'No se pudo completar la solicitud');
    error.status = res.status;
    throw error;
};

const userNameEl = document.getElementById('userName');
const setUserName = () => {
    if (!userNameEl) return;
    userNameEl.textContent = user?.nombre || user?.name || 'Usuario';
};
// inicial (puede actualizarse tras validar sesión)
setUserName();

const filterFechaElInit = document.getElementById('filterFecha');
if (filterFechaElInit) {
    filterFechaElInit.value = new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Lima'
    });
}

const normalizeDate = (value) => {
    if (!value) return value;

    const normalized = String(value).trim();
    if (!normalized) return normalized;
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;

    if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(normalized)) {
        const [day, month, year] = normalized.split(/[/-]/).map(Number);
        const parsed = new Date(year, month - 1, day);
        if (!Number.isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
    }

    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    return normalized;
};

const getFecha = () => {
    const filterEl = document.getElementById('filterFecha');
    const value = filterEl?.value || '';
    return normalizeDate(value || new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Lima'
    }));
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
    if (!dateStr) return '--:--';

    const timeMatch = String(dateStr).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?$/i);
    let d;

    if (timeMatch) {
        let hours = Number(timeMatch[1]);
        const minutes = Number(timeMatch[2]);
        const period = timeMatch[3]?.replace(/\s|\./g, '').toLowerCase();
        const isValidHour = period ? hours >= 1 && hours <= 12 : hours >= 0 && hours <= 23;
        if (!isValidHour || minutes > 59) return String(dateStr);

        if (period) {
            hours = (hours % 12) + (period === 'pm' ? 12 : 0);
        }

        d = new Date(2000, 0, 1, hours, minutes);
    } else {
        d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return String(dateStr);
    }

    return d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
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
        const tbody = document.querySelector('#serviciosTable tbody');
        if (!tbody) return; // Tabla no lista aún
        
        const fecha = getFecha();
        const payload = await window.DataService.get(`/servicios?fecha=${encodeURIComponent(fecha)}`);
        const servicios = Array.isArray(payload) ? payload : (payload.servicios || []);
        if (!servicios.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="table-empty">
                        <i class="bi bi-clipboard2-check"></i>
                        No hay registros para esta fecha.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = servicios.map(s => {
                const tipoLabel = s.tipo === 'gasto' ? 'Gasto' : 'Servicio';
                const tipoClass = s.tipo === 'gasto' ? 'type-expense' : 'type-service';
                const hora = formatTime(s.hora || s.fechaRegistro);
                const precioValue = s.tipo === 'gasto' ? '-' : `S/.${Number(s.precio || 0).toFixed(2)}`;
                const utilidadValue = `S/.${Number(s.utilidad || 0).toFixed(2)}`;
                return `
                <tr class="${tipoClass}">
                    <td data-label="Hora">${escapeHtml(hora)}</td>
                    <td data-label="Tipo"><span class="activity-type ${tipoClass}">${tipoLabel}</span></td>
                    <td data-label="Descripción">
                        ${escapeHtml(s.servicio || '-')}
                        <span class="activity-mobile-meta">
                            <span class="activity-mobile-model">${escapeHtml(s.modelo || '-')}</span>
                            <span class="activity-mobile-context">${escapeHtml(hora)} · ${tipoLabel}</span>
                        </span>
                    </td>
                    <td data-label="Modelo / Categoría">${escapeHtml(s.modelo || '-')}</td>
                    <td data-label="Precio" class="money-positive">${precioValue}</td>
                    <td data-label="Costo" class="money-negative">S/.${Number(s.costo || 0).toFixed(2)}</td>
                    <td data-label="Utilidad" class="${Number(s.utilidad || 0) < 0 ? 'money-negative' : 'money-positive'}">${utilidadValue}</td>
                    <td data-label="Acción">
                        <button class="btn-table" type="button" title="Eliminar registro" aria-label="Eliminar registro" onclick="deleteServicio('${s.id}')">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </td>
                    <td data-label="Detalle" class="activity-toggle-cell">
                        <button class="activity-toggle" type="button" aria-expanded="false" aria-label="Mostrar detalles">
                            <i class="bi bi-chevron-down" aria-hidden="true"></i>
                        </button>
                    </td>
                </tr>
            `;
            }).join('');
        }

        const ingresos = servicios
            .filter(item => item.tipo !== 'gasto')
            .reduce((sum, item) => sum + Number(item.precio || 0), 0);
        const costos = servicios
            .filter(item => item.tipo !== 'gasto')
            .reduce((sum, item) => sum + Number(item.costo || 0), 0);
        const gastos = servicios
            .filter(item => item.tipo === 'gasto')
            .reduce((sum, item) => sum + Number(item.costo || 0), 0);
        const utilidadNeta = ingresos - costos - gastos;
        const resAvance = utilidadNeta / 2;

        document.getElementById('resIngresos').textContent = `S/.${ingresos.toFixed(2)}`;
        document.getElementById('resCostos').textContent = `S/.${costos.toFixed(2)}`;
        document.getElementById('resGastos').textContent = `S/.${gastos.toFixed(2)}`;
        

        document.getElementById('resAvance').textContent = `S/.${resAvance.toFixed(2)}`;

        // Actualizar avance mensual en el header
        try {
            await loadMonthlyAvance();
        } catch (err) {
            console.warn('[registro-servicios] No se pudo actualizar avance mensual:', err);
        }

        const utilidadEl = document.getElementById('resUtilidad');
        utilidadEl.textContent = `S/.${utilidadNeta.toFixed(2)}`;
        utilidadEl.classList.toggle('money-negative', utilidadNeta < 0);
        utilidadEl.classList.toggle('money-positive', utilidadNeta >= 0);
    } catch (error) {
        console.error('[registro-servicios] Error cargando servicios:', error);
        const tbody = document.querySelector('#serviciosTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="table-empty is-error">
                    <i class="bi bi-exclamation-circle"></i>
                    No se pudieron cargar los registros.
                </td>
            </tr>
        `;
        document.getElementById('resIngresos').textContent = 'S/.0.00';
        document.getElementById('resCostos').textContent = 'S/.0.00';
        document.getElementById('resGastos').textContent = 'S/.0.00';
        document.getElementById('resUtilidad').textContent = 'S/.0.00';
        window.AppMessages?.networkError(error, { title: 'Servicios no disponibles' });
    }
};

document.querySelector('#serviciosTable tbody')?.addEventListener('click', (event) => {
    const toggle = event.target.closest('.activity-toggle');
    if (!toggle) return;

    const row = toggle.closest('tr');
    if (!row) return;

    const expanded = row.classList.toggle('is-expanded');
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? 'Ocultar detalles' : 'Mostrar detalles');
});

// Calcula el monto acumulado del mes (utilidad neta hasta hoy).
const loadMonthlyAvance = async () => {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-based
        const days = today.getDate(); // hasta hoy

        const pad = (n) => (n < 10 ? '0' + n : '' + n);
        const dates = [];
        for (let d = 1; d <= days; d++) {
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`; // YYYY-MM-DD
            dates.push(dateStr);
        }

        // Hacer peticiones en paralelo
        const requests = dates.map(dt => window.DataService.get(`/servicios?fecha=${encodeURIComponent(dt)}`).catch(() => []));
        const results = await Promise.all(requests);

        let ingresos = 0;
        let costos = 0;
        let gastos = 0;

        results.forEach(arr => {
            const servicios = Array.isArray(arr) ? arr : (arr.servicios || []);
            servicios.forEach(s => {
                if (s.tipo === 'gasto') {
                    gastos += Number(s.costo || 0);
                } else {
                    ingresos += Number(s.precio || 0);
                    costos += Number(s.costo || 0);
                }
            });
        });

        const utilidadNeta = ingresos - costos - gastos;
        const montoDelMes = utilidadNeta / 2;
        const el = document.getElementById('monthAmount');
        if (el) {
            el.textContent = `S/.${montoDelMes.toFixed(2)}`;
            el.classList.toggle('money-negative', utilidadNeta < 0);
            el.classList.toggle('money-positive', utilidadNeta >= 0);
        }
        return { utilidadNeta, montoDelMes };
    } catch (error) {
        console.error('[registro-servicios] Error calculando avance mensual:', error);
        const el = document.getElementById('monthAmount');
        if (el) el.textContent = 'S/.0.00';
        throw error;
    }
};

const tipoSelect = document.getElementById('s-tipo');
const precioInput = document.getElementById('s-precio');
const costoInput = document.getElementById('s-costo');
const modeloInput = document.getElementById('s-modelo');
const submitButton = document.getElementById('submitButton');
const servicioForm = document.getElementById('servicioForm');

const updateFormMode = () => {
    const tipo = tipoSelect?.value || 'servicio';
    const isExpense = tipo === 'gasto';
    servicioForm?.classList.toggle('is-expense', isExpense);
    if (tipo === 'gasto') {
        modeloInput.placeholder = 'Ej: Herramienta / Suplemento';
        modeloInput.required = false;
        precioInput.value = '0';
        precioInput.disabled = true;
        precioInput.required = false;
        document.getElementById('precioLabel').textContent = 'Precio';
        document.getElementById('costoLabel').textContent = 'Importe';
        costoInput.placeholder = 'Importe';
        submitButton.innerHTML = '<i class="bi bi-save"></i> Registrar Gasto';
    } else {
        modeloInput.placeholder = 'Ej: Samsung Galaxy S21';
        modeloInput.required = true;
        precioInput.disabled = false;
        precioInput.required = true;
        document.getElementById('precioLabel').textContent = 'Precio';
        document.getElementById('costoLabel').textContent = 'Costo';
        costoInput.placeholder = 'Costo';
        submitButton.innerHTML = '<i class="bi bi-save"></i> Registrar Servicio';
    }
};

if (tipoSelect) {
    tipoSelect.addEventListener('change', updateFormMode);
    updateFormMode();
}

if (servicioForm) {
    servicioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tipo = tipoSelect?.value || 'servicio';
        const precio = tipo === 'gasto' ? 0 : parseFloat(precioInput?.value || 0);
        const costo = parseFloat(document.getElementById('s-costo')?.value || 0);

        const body = {
            tipo,
            servicio: document.getElementById('s-servicio')?.value.trim() || '',
            modelo: document.getElementById('s-modelo')?.value.trim() || '',
            precio,
            costo,
            utilidad: tipo === 'gasto'
                ? Math.round(-costo * 100) / 100
                : Math.round((precio - costo) * 100) / 100,
            fecha: getFecha()
        };

        try {
            const result = await window.DataService.create('/servicios', body, { resourceKey: `servicios:${body.fecha}` });
            e.target.reset();
            updateFormMode();
            await loadServicios();
            window.AppMessages?.success(result.queued ? 'Servicio guardado en el dispositivo; se sincronizará al reconectar.' : 'Servicio registrado correctamente');
        } catch (error) {
            console.error('[registro-servicios] Error registrando servicio:', error);
            window.AppMessages?.networkError(error, { title: 'No se pudo guardar' });
        }
    });
}

const deleteServicio = async (id) => {
    if (confirm('¿Eliminar este servicio?')) {
        try {
            const result = await window.DataService.delete(`/servicios/${id}`, { resourceKey: `servicio:${id}` });
            window.AppMessages?.success(result.queued ? 'Eliminación pendiente de sincronización' : 'Servicio eliminado');
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

        const res = await fetch(`${API}/reportes/imagen?fecha=${encodeURIComponent(getFecha())}`, {
            headers: getHeaders(),
            credentials: 'include'
        });

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
        await fetch(`${API}/auth/logout`, { method: 'POST', headers: getHeaders(), credentials: 'include' });
    } catch (error) {
        console.warn('[registro-servicios] No se pudo cerrar la sesion en servidor:', error);
    } finally {
        localStorage.removeItem('user');
        await window.OfflineStore?.deleteMeta?.('session-profile');
        window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
    }
};

const filterFechaEl = document.getElementById('filterFecha');
if (filterFechaEl) {
    filterFechaEl.addEventListener('change', () => {
        loadServicios();
    });
}

// ===============================
// INICIO
// ===============================
(async () => {
    const valid = await validateSession();
    if (valid) {
        setUserName();
        loadServicios();
    }
})();
