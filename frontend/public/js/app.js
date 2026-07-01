import { getMonthData, saveDayData, deleteMonthData } from './api.js';
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
    } catch (err) { console.error(err); alert('No se pudo generar Excel: ' + err.message); }
    finally { hidePageLoader(); }
};

window.exportToPDF = async () => {
    try {
        showPageLoader();
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
        exportToPDF(currentYear, currentMonth, monthData.days);
    } catch (err) { console.error(err); alert('No se pudo generar PDF: ' + err.message); }
    finally { hidePageLoader(); }
};

window.exportToPNG = async () => {
    try {
        showPageLoader();
        await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        exportToImage(currentYear, currentMonth, monthData.days);
    } catch (err) { console.error(err); alert('No se pudo generar la imagen: ' + err.message); }
    finally { hidePageLoader(); }
};

async function downloadDashboardBackupJson() {
    try {
        const backup = {
            year: currentYear,
            month: currentMonth,
            days: (monthData.days || []).map((day) => ({
                day: Number(day.day),
                st1: {
                    cash: Number(day.st1?.cash) || 0,
                    yape: Number(day.st1?.yape) || 0
                },
                st2: {
                    cash: Number(day.st2?.cash) || 0,
                    yape: Number(day.st2?.yape) || 0
                }
            }))
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard-${currentYear}-${String(currentMonth).padStart(2, '0')}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast('Backup del dashboard descargado');
    } catch (err) {
        showToast(err.message || 'Error al descargar el backup del dashboard', true);
        console.error(err);
    }
}

async function importDashboardBackupJson(file) {
    if (!file) return;
    const confirmed = confirm(`¿Restaurar este backup del dashboard en ${currentMonth}/${currentYear}?`);
    if (!confirmed) return;

    try {
        showPageLoader();
        const text = await file.text();
        const backup = JSON.parse(text);
        const days = Array.isArray(backup?.days) ? backup.days : [];
        if (!backup || typeof backup !== 'object' || days.length === 0) {
            throw new Error('El archivo no contiene datos válidos del dashboard');
        }

        const targetYear = Number(backup.year || currentYear);
        const targetMonth = Number(backup.month || currentMonth);

        for (const day of days) {
            const normalizedDay = Number(day.day);
            if (!Number.isFinite(normalizedDay)) continue;
            await saveDayData({
                year: targetYear,
                month: targetMonth,
                day: normalizedDay,
                st1: {
                    cash: Number(day.st1?.cash) || 0,
                    yape: Number(day.st1?.yape) || 0
                },
                st2: {
                    cash: Number(day.st2?.cash) || 0,
                    yape: Number(day.st2?.yape) || 0
                }
            });
        }

        currentYear = targetYear;
        currentMonth = targetMonth;
        await loadMonth();
        showToast('Backup del dashboard restaurado correctamente');
    } catch (err) {
        showToast(err.message || 'Error al importar el backup del dashboard', true);
        console.error(err);
    } finally {
        hidePageLoader();
    }
}

window.exportJSON = () => downloadDashboardBackupJson();
window.importBackupJSON = (file) => importDashboardBackupJson(file);
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
        const res = await fetch(window.getApiUrl('/auth/check'));
        const data = await res.json();
        if (!data.logged) return window.location.href = '/login/index.html';
        const userName = data.user?.nombre || data.user?.username || 'Usuario';
        document.getElementById('userInfo').textContent = `👤 ${userName}`;
        renderQuickAccess(data.user);
    } catch(e) { window.location.href = '/login/index.html'; }

    const monthPicker = document.getElementById('monthPicker');
    monthPicker.value = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    monthPicker.addEventListener('change', (e) => {
        const [y, m] = e.target.value.split('-');
        currentYear = parseInt(y); currentMonth = parseInt(m);
        loadMonth();
    });

    document.getElementById('downloadPdfBtn').addEventListener('click', () => window.exportToPDF());
    document.getElementById('downloadBackupBtn').addEventListener('click', downloadDashboardBackupJson);
    document.getElementById('uploadBackupBtn').addEventListener('click', () => document.getElementById('backupFileInput').click());
    document.getElementById('backupFileInput').addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            importDashboardBackupJson(file);
            e.target.value = '';
        }
    });

    generateTableStructure(); // Generar encabezados estáticos
    await loadMonth();

    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            console.log('Service Worker registrado');
        } catch (err) { console.warn('Error al registrar Service Worker', err); }
    }
    // Ocultar loader cuando la app esté lista
    hidePageLoader();
});

async function loadMonth() {
    try {
        monthData = await getMonthData(currentYear, currentMonth);
        if (!monthData.days) monthData.days = [];
        renderTableRows();
        recalculateAll();
    } catch (err) { console.error('Error loading:', err); }
}

// GENERACIÓN DINÁMICA DE ENCABEZADOS DE LA TABLA
function generateTableStructure() {
    const thead = document.getElementById('tableHead');
    thead.innerHTML = `
        <tr>
            <th rowspan="2">Fecha</th>
            <th colspan="2">ST1</th>
            <th colspan="2">ST2</th>
            <th colspan="2" class="col-total">Total Día</th>
            <th colspan="2" class="col-acum">Acumulado</th>
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

// GENERACIÓN DINÁMICA DE FILAS DE LA TABLA SEGÚN EL MES
function renderTableRows() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const dayObj = monthData.days.find(d => d.day === i);
        const st1Cash = dayObj?.st1?.cash || '';
        const st1Yape = dayObj?.st1?.yape || '';
        const st2Cash = dayObj?.st2?.cash || '';
        const st2Yape = dayObj?.st2?.yape || '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:bold; padding:10px;">${i}</td>
            <td><input id="input-${i}-st1-cash" name="st1_cash_${i}" autocomplete="off" type="number" step="0.01" data-day="${i}" data-tech="st1" data-type="cash" value="${st1Cash}" placeholder="0"></td>
            <td><input id="input-${i}-st1-yape" name="st1_yape_${i}" autocomplete="off" type="number" step="0.01" data-day="${i}" data-tech="st1" data-type="yape" value="${st1Yape}" placeholder="0"></td>
            <td><input id="input-${i}-st2-cash" name="st2_cash_${i}" autocomplete="off" type="number" step="0.01" data-day="${i}" data-tech="st2" data-type="cash" value="${st2Cash}" placeholder="0"></td>
            <td><input id="input-${i}-st2-yape" name="st2_yape_${i}" autocomplete="off" type="number" step="0.01" data-day="${i}" data-tech="st2" data-type="yape" value="${st2Yape}" placeholder="0"></td>
            <td id="total-cash-${i}" class="text-end">S/ 0.00</td>
            <td id="total-yape-${i}" class="text-end">S/ 0.00</td>
            <td id="acum-cash-${i}" class="text-end">S/ 0.00</td>
            <td id="acum-yape-${i}" class="text-end">S/ 0.00</td>
        `;
        tbody.appendChild(tr);
    }

    document.querySelectorAll('input[data-day]').forEach(input => {
        const saveForInput = (e) => {
            const day = parseInt(e.target.dataset.day);
            const tech = e.target.dataset.tech;
            const type = e.target.dataset.type;
            handleInput(day, tech, type, e.target.value);
            handleSave(day);
        };
        input.addEventListener('input', saveForInput);
        input.addEventListener('blur', saveForInput);
        input.addEventListener('change', saveForInput);
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
            if (response && response.success) {
                showToast(`Día ${day} guardado correctamente`);
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
            path: '/fill.html',
            available: true
        },
        {
            title: 'Ver tabla',
            description: 'Consultar el registro mensual',
            icon: 'fa-table',
            path: '/table.html',
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
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `app-toast${isError ? ' toast-error' : ' toast-success'}`;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}
