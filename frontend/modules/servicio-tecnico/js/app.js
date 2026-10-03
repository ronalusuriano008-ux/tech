import { getMonthData, saveDayData, deleteDayData, deleteMonthData } from './api.js';
import { formatPEN, parseNumber } from './calculations.js';
import { exportToExcel } from './exportExcel.js';
import { exportToPDF } from './exportPDF.js';
import { exportToImage } from './exportToImage.js';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let monthData = { year: currentYear, month: currentMonth, days: [] };
const saveDebouncers = {}; // Controlador de debounce por día

// Carga de scripts externos bajo demanda para reducir requests iniciales
const _loadedScripts = new Map();
function loadScriptOnce(url) {
    if (_loadedScripts.has(url)) return _loadedScripts.get(url);
    const p = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = () => resolve(url);
        s.onerror = (e) => reject(new Error('Falló carga ' + url));
        document.head.appendChild(s);
    });
    _loadedScripts.set(url, p);
    return p;
}

const notifyError = (error, title = 'No se pudo completar') => {
    if (window.AppMessages?.networkError) {
        window.AppMessages.networkError(error, { title });
    } else {
        console.error(error);
    }
};

function showPageLoader() {
    const l = document.getElementById('pageLoader');
    if (l) { l.style.display = 'flex'; l.setAttribute('aria-hidden','false'); }
}
function hidePageLoader() {
    const l = document.getElementById('pageLoader');
    if (l) { l.style.display = 'none'; l.setAttribute('aria-hidden','true'); }
}

// Wrappers para export: cargan librerías sólo cuando se necesitan
window.exportToExcel = async () => {
    try {
        showPageLoader();
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
        exportToExcel(currentYear, currentMonth, monthData.days);
    } catch (err) { console.error(err); notifyError(err, 'No se pudo generar Excel'); }
    finally { hidePageLoader(); }
};

window.exportToPDF = async () => {
    try {
        showPageLoader();
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
        exportToPDF(currentYear, currentMonth, monthData.days);
    } catch (err) { console.error(err); notifyError(err, 'No se pudo generar PDF'); }
    finally { hidePageLoader(); }
};

window.exportToPNG = async () => {
    try {
        showPageLoader();
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        exportToImage(currentYear, currentMonth, monthData.days);
    } catch (err) { console.error(err); notifyError(err, 'No se pudo generar la imagen'); }
    finally { hidePageLoader(); }
};

window.deleteMonth = async () => {
    if (confirm(`¿Eliminar todos los datos de ${currentMonth}/${currentYear}?`)) {
        await deleteMonthData(currentYear, currentMonth);
        await loadMonth();
        showToast('Mes eliminado');
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar info de usuario
    try {
        const res = await fetch(window.getApiUrl('/auth/check'), { credentials: 'include' });
        const data = await res.json();
        if (!data.logged) return window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
        const userName = data.user?.nombre || data.user?.username || 'Usuario';
        const userInfoEl = document.getElementById('userInfo');
        if (userInfoEl) {
            userInfoEl.innerHTML = '';
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-user-circle';
            const name = document.createElement('span');
            name.textContent = userName;
            userInfoEl.appendChild(icon);
            userInfoEl.appendChild(name);
        }
        renderQuickAccess(data.user);
    } catch(e) {
        notifyError(e, 'No se pudo validar la sesión');
        window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
    }

    const monthPicker = document.getElementById('monthPicker');
    if (monthPicker) {
        monthPicker.value = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        monthPicker.addEventListener('change', (e) => {
            const [y, m] = e.target.value.split('-');
            currentYear = parseInt(y); currentMonth = parseInt(m);
            loadMonth();
        });
    }

    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => window.exportToPDF());
    }

    const addDayBtn = document.getElementById('addDayBtn');
    if (addDayBtn) {
        addDayBtn.addEventListener('click', () => openDayModal(new Date().getDate()));
    }

    const dayModalClose = document.getElementById('dayModalClose');
    if (dayModalClose) {
        dayModalClose.addEventListener('click', closeDayModal);
    }

    const dayModalCancel = document.getElementById('dayModalCancel');
    if (dayModalCancel) {
        dayModalCancel.addEventListener('click', closeDayModal);
    }

    const dayModalForm = document.getElementById('dayModalForm');
    if (dayModalForm) {
        dayModalForm.addEventListener('submit', submitDayModal);
    }

    generateTableStructure(); // Generar encabezados estáticos
    await loadMonth();

    // Ocultar loader cuando la app esté lista
    hidePageLoader();
});

async function loadMonth() {
    try {
        monthData = await getMonthData(currentYear, currentMonth);
        if (!monthData.days) monthData.days = [];
        renderTableRows();
        recalculateAll();
    } catch (err) {
        console.error('Error loading:', err);
        notifyError(err, 'No se pudo cargar el mes');
    }
}

// GENERACIÓN DINÁMICA DE ENCABEZADOS DE LA TABLA
function generateTableStructure() {
    const thead = document.getElementById('tableHead');
    thead.innerHTML = `
        <tr>
            <th rowspan="2">Dia</th>
            <th colspan="2">ST1</th>
            <th colspan="2">ST2</th>
            <th colspan="2" class="col-total">Total Día</th>
            <th colspan="2" class="col-acum">Acumulado</th>
            <th rowspan="2" class="no-print">Acciones</th>
        </tr>
        <tr>
            <th class="col-cash">Efectivo</th>
            <th class="col-yape">Yape</th>
            <th class="col-cash">Efectivo</th>
            <th class="col-yape">Yape</th>
            <th class="col-cash col-total">Efectivo</th>
            <th class="col-yape col-total">Yape</th>
            <th class="col-cash col-acum">Efectivo</th>
            <th class="col-yape col-acum">Yape</th>
        </tr>
    `;
}

function openDayModal(day = null) {
    const modal = document.getElementById('dayModal');
    const dayInput = document.getElementById('dayModalDay');
    const st1Cash = document.getElementById('dayModalSt1Cash');
    const st1Yape = document.getElementById('dayModalSt1Yape');
    const st2Cash = document.getElementById('dayModalSt2Cash');
    const st2Yape = document.getElementById('dayModalSt2Yape');
    const commentInput = document.getElementById('dayModalComment');
    const title = document.getElementById('dayModalTitle');

    if (!modal || !dayInput || !st1Cash || !st1Yape || !st2Cash || !st2Yape || !commentInput) return;

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const selectedDay = Math.min(Math.max(Number(day || 1), 1), daysInMonth);
    const dayObj = monthData.days.find(d => d.day === selectedDay) || { st1: { cash: 0, yape: 0 }, st2: { cash: 0, yape: 0 }, comment: '' };
    const isEdit = Boolean(day);

    title.textContent = isEdit ? 'Editar día' : 'Agregar día';
    dayInput.value = selectedDay;
    dayInput.max = String(daysInMonth);
    dayInput.readOnly = isEdit;
    dayInput.style.opacity = isEdit ? '0.9' : '1';
    st1Cash.value = dayObj.st1.cash ?? 0;
    st1Yape.value = dayObj.st1.yape ?? 0;
    st2Cash.value = dayObj.st2.cash ?? 0;
    st2Yape.value = dayObj.st2.yape ?? 0;
    commentInput.value = dayObj.comment || '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
}

function closeDayModal() {
    const modal = document.getElementById('dayModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    const form = document.getElementById('dayModalForm');
    if (form) form.reset();
}

function sanitizeText(value) {
    return String(value ?? '').replace(/[<>"'&]/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function getDynamicValueClass(value, tech = 'st1', type = 'cash') {
    const numericValue = Number(value || 0);
    if (numericValue === 0) return 'day-readonly-box--zero';
    if (type === 'cash') return 'day-readonly-box--cash';
    if (type === 'yape') return 'day-readonly-box--yape';
    if (tech === 'st1') return 'day-readonly-box--st1';
    return 'day-readonly-box--st2';
}

async function submitDayModal(event) {
    event.preventDefault();
    const day = Number(document.getElementById('dayModalDay')?.value || 0);
    const comment = String(document.getElementById('dayModalComment')?.value || '').trim();
    if (!day) {
        showToast('Selecciona un día válido', true);
        return;
    }

    const payload = {
        year: currentYear,
        month: currentMonth,
        day,
        comment: comment || undefined,
        st1: {
            cash: Number(document.getElementById('dayModalSt1Cash')?.value || 0),
            yape: Number(document.getElementById('dayModalSt1Yape')?.value || 0)
        },
        st2: {
            cash: Number(document.getElementById('dayModalSt2Cash')?.value || 0),
            yape: Number(document.getElementById('dayModalSt2Yape')?.value || 0)
        }
    };

    try {
        const response = await saveDayData(payload);
        if (response && (response.success || response.queued)) {
            showToast(response.queued ? `Día ${day} guardado localmente` : `Día ${day} guardado correctamente`);
            closeDayModal();
            await loadMonth();
        } else {
            showToast('No se pudo guardar el día', true);
        }
    } catch (error) {
        console.error('Error guardando desde modal:', error);
        showToast('No se pudo guardar el día', true);
    }
}

async function deleteDayByNumber(day) {
    if (!day) return;
    if (!confirm(`¿Eliminar los datos del día ${day}/${currentMonth}/${currentYear}?`)) return;

    try {
        const response = await deleteDayData(currentYear, currentMonth, day);
        if (response && (response.success || response.queued)) {
            showToast(response.queued ? 'Eliminación pendiente de sincronización' : 'Día eliminado');
            await loadMonth();
        } else {
            showToast('No se pudo eliminar el día', true);
        }
    } catch (error) {
        console.error('Error eliminando día:', error);
        showToast('No se pudo eliminar el día', true);
    }
}

// GENERACIÓN DINÁMICA DE FILAS DE LA TABLA SEGÚN EL MES
function renderTableRows() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const dayObj = monthData.days.find(d => d.day === i);
        const st1Cash = dayObj?.st1?.cash ?? 0;
        const st1Yape = dayObj?.st1?.yape ?? 0;
        const st2Cash = dayObj?.st2?.cash ?? 0;
        const st2Yape = dayObj?.st2?.yape ?? 0;

        const tr = document.createElement('tr');
        const commentLabel = (dayObj?.comment || '').trim();
        tr.innerHTML = `
            <td class="day-cell day-cell--date">
                <span class="day-cell__number">${i}</span>
                <span class="day-cell__comment ${commentLabel ? '' : 'day-cell__comment--empty'}">${commentLabel ? sanitizeText(commentLabel) : 'Sin nota'}</span>
            </td>
            <td><div class="day-readonly-box day-readonly-box--st1 ${getDynamicValueClass(st1Cash, 'st1', 'cash')}">${Number(st1Cash).toFixed(2)}</div></td>
            <td><div class="day-readonly-box day-readonly-box--st1 ${getDynamicValueClass(st1Yape, 'st1', 'yape')}">${Number(st1Yape).toFixed(2)}</div></td>
            <td><div class="day-readonly-box day-readonly-box--st2 ${getDynamicValueClass(st2Cash, 'st2', 'cash')}">${Number(st2Cash).toFixed(2)}</div></td>
            <td><div class="day-readonly-box day-readonly-box--st2 ${getDynamicValueClass(st2Yape, 'st2', 'yape')}">${Number(st2Yape).toFixed(2)}</div></td>
            <td id="total-cash-${i}" class="text-end table-metric table-metric--cash">S/ 0.00</td>
            <td id="total-yape-${i}" class="text-end table-metric table-metric--yape">S/ 0.00</td>
            <td id="acum-cash-${i}" class="text-end table-metric table-metric--cash">S/ 0.00</td>
            <td id="acum-yape-${i}" class="text-end table-metric table-metric--yape">S/ 0.00</td>
            <td class="no-print">
                <div class="table-actions">
                    <button type="button" class="btn btn-sm btn-outline-primary" data-day-action="edit" data-day="${i}"><i class="fa-solid fa-pen"></i> Editar</button>
                    <button type="button" class="btn btn-sm btn-outline-danger" data-day-action="delete" data-day="${i}"><i class="fa-solid fa-trash"></i> Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    }

    document.querySelectorAll('[data-day-action]').forEach(button => {
        button.addEventListener('click', async () => {
            const day = Number(button.dataset.day);
            if (!day) return;

            if (button.dataset.dayAction === 'edit') {
                openDayModal(day);
                return;
            }

            if (button.dataset.dayAction === 'delete') {
                await deleteDayByNumber(day);
            }
        });
    });
}

function handleInput(day, tech, type, value) {
    console.log('[handleInput] Día:', day, 'Tech:', tech, 'Type:', type, 'Value:', value);
    let dayObj = monthData.days.find(d => d.day === day);
    if (!dayObj) {
        dayObj = { day, st1: { cash: 0, yape: 0 }, st2: { cash: 0, yape: 0 } };
        monthData.days.push(dayObj);
        monthData.days.sort((a, b) => a.day - b.day);
        console.log('[handleInput] Nuevo día creado:', dayObj);
    }
    dayObj[tech][type] = parseNumber(value);
    console.log('[handleInput] Dato actualizado en monthData:', dayObj);
    recalculateAll();
}

function recalculateAll() {
    let acumCash = 0, acumYape = 0;
    let prodSt1 = 0, prodSt2 = 0, totalCash = 0, totalYape = 0;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const dayObj = monthData.days.find(d => d.day === i);
        const st1Cash = dayObj?.st1?.cash || 0;
        const st1Yape = dayObj?.st1?.yape || 0;
        const st2Cash = dayObj?.st2?.cash || 0;
        const st2Yape = dayObj?.st2?.yape || 0;

        const dayTotalCash = st1Cash + st2Cash;
        const dayTotalYape = st1Yape + st2Yape;

        acumCash += dayTotalCash;
        acumYape += dayTotalYape;

        prodSt1 += st1Cash + st1Yape;
        prodSt2 += st2Cash + st2Yape;
        totalCash += dayTotalCash;
        totalYape += dayTotalYape;

        // Actualizar DOM de la fila
        const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = formatPEN(val); };
        setText(`total-cash-${i}`, dayTotalCash);
        setText(`total-yape-${i}`, dayTotalYape);
        setText(`acum-cash-${i}`, acumCash);
        setText(`acum-yape-${i}`, acumYape);
    }

    // Actualizar Dashboard
    document.getElementById('dash-prod-st1').textContent = formatPEN(prodSt1);
    document.getElementById('dash-prod-st2').textContent = formatPEN(prodSt2);
    document.getElementById('dash-total-cash').textContent = formatPEN(totalCash);
    document.getElementById('dash-total-yape').textContent = formatPEN(totalYape);
    document.getElementById('dash-total-general').textContent = formatPEN(totalCash + totalYape);
}

async function handleSave(day) {
    console.log('[handleSave] Iniciando guardado para día:', day);
    const dayObj = monthData.days.find(d => d.day === day);
    if (!dayObj) {
        console.log('[handleSave] No hay objeto para el día:', day);
        return;
    }
    
    // Limpiar debouncer anterior si existe
    if (saveDebouncers[day]) {
        console.log('[handleSave] Limpiando debouncer anterior para día:', day);
        clearTimeout(saveDebouncers[day]);
    }
    
    // Crear nuevo debouncer para este día (esperar 1 segundo después del último cambio)
    saveDebouncers[day] = setTimeout(async () => {
        try {
            console.log('[handleSave] Enviando datos para día:', day, dayObj);
            const response = await saveDayData({
                year: currentYear, month: currentMonth, day: day,
                st1: dayObj.st1, st2: dayObj.st2
            });
            console.log('[handleSave] Respuesta recibida:', response);
            if (response && (response.success || response.queued)) {
                showToast(response.queued ? `Día ${day} guardado localmente; pendiente de sincronización` : `Día ${day} guardado correctamente`);
                console.log('[handleSave] Guardado exitoso para día:', day);
            } else {
                showToast(`Error: Día ${day} no se guardó`, true);
                console.log('[handleSave] Error: respuesta sin success flag');
            }
        } catch (err) { 
            console.error('[handleSave] Error al guardar día:', day, err);
            showToast(`Error al guardar día ${day}: ${err.message || 'Error desconocido'}`, true); 
        }
    }, 1000);
}

function renderQuickAccess(user = {}) {
    const container = document.getElementById('quickAccess');
    if (!container) return;

    const isAdmin = user?.role === 'ADMIN';
    const apps = [
        {
            title: 'Registrar servicios',
            description: 'Ingreso rápido de servicios y asistencia',
            icon: 'fa-clipboard-list',
            path: window.AppConfig?.registroPath || '/registro/index.html',
            available: true
        },
        {
            title: 'Rellenar datos',
            description: 'Editar información del mes en curso',
            icon: 'fa-edit',
            path: window.AppConfig?.fillPath || '/fill.html',
            available: true
        },
        {
            title: 'Ver tabla',
            description: 'Consultar el registro mensual',
            icon: 'fa-table',
            path: window.AppConfig?.tablePath || '/table.html',
            available: true
        }
    ];

    if (isAdmin) {
        apps.unshift({
            title: 'Panel de administración',
            description: 'Usuarios, configuración y respaldos',
            icon: 'fa-shield-halved',
            path: window.AppConfig?.adminPath || '/admin/index.html',
            available: true
        });
    }

    container.innerHTML = apps.map((app) => `
        <div class="col-12 col-md-6 col-lg-3">
            <a href="${app.path}" class="card h-100 text-decoration-none text-dark border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="rounded-circle bg-primary bg-opacity-10 p-3">
                            <i class="fas ${app.icon} text-primary"></i>
                        </div>
                        ${isAdmin && app.title === 'Panel de administración' ? '<span class="badge text-bg-warning">Admin</span>' : ''}
                    </div>
                    <h5 class="card-title">${app.title}</h5>
                    <p class="card-text text-muted small">${app.description}</p>
                </div>
            </a>
        </div>
    `).join('');
}

function showToast(msg, isError = false) {
    if (window.AppMessages?.toast) {
        window.AppMessages.toast(msg, isError);
        return;
    }
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `app-toast${isError ? ' toast-error' : ' toast-success'}`;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}
