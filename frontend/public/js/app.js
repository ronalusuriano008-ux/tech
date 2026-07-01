import { getMonthData, saveDayData, deleteMonthData } from './api.js';
import { formatPEN, parseNumber } from './calculations.js';
import { exportToExcel } from './exportExcel.js';
import { exportToPDF } from './exportPDF.js';
import { exportToImage } from './exportToImage.js';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let monthData = { year: currentYear, month: currentMonth, days: [] };

// Exponer para HTML
window.exportToExcel = () => exportToExcel(currentYear, currentMonth, monthData.days);
window.exportToPDF = () => exportToPDF(currentYear, currentMonth, monthData.days);
window.exportToPNG = () => exportToImage(currentYear, currentMonth, monthData.days);

async function downloadBackupJson() {
    try {
        const res = await fetch(window.getApiUrl('/backup/export'));
        if (!res.ok) throw new Error('No se pudo descargar el backup general');
        const backup = await res.json();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-general-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast('Backup general descargado');
    } catch (err) {
        showToast(err.message || 'Error al descargar el backup general', true);
        console.error(err);
    }
}

async function importBackupJson(file) {
    if (!file) return;
    const confirmed = confirm('¿Restaurar este backup general en la base de datos?');
    if (!confirmed) return;

    try {
        const text = await file.text();
        const backup = JSON.parse(text);
        const res = await fetch(window.getApiUrl('/backup/import'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backup)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'No se pudo importar el backup');
        showToast('Backup restaurado correctamente');
        window.location.reload();
    } catch (err) {
        showToast(err.message || 'Error al importar el backup', true);
        console.error(err);
    }
}

window.exportJSON = () => downloadBackupJson();
window.importBackupJSON = (file) => importBackupJson(file);
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
    document.getElementById('downloadBackupBtn').addEventListener('click', downloadBackupJson);
    document.getElementById('uploadBackupBtn').addEventListener('click', () => document.getElementById('backupFileInput').click());
    document.getElementById('backupFileInput').addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            importBackupJson(file);
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
            <td><input type="number" step="0.01" data-day="${i}" data-tech="st1" data-type="cash" value="${st1Cash}" placeholder="0"></td>
            <td><input type="number" step="0.01" data-day="${i}" data-tech="st1" data-type="yape" value="${st1Yape}" placeholder="0"></td>
            <td><input type="number" step="0.01" data-day="${i}" data-tech="st2" data-type="cash" value="${st2Cash}" placeholder="0"></td>
            <td><input type="number" step="0.01" data-day="${i}" data-tech="st2" data-type="yape" value="${st2Yape}" placeholder="0"></td>
            <td id="total-cash-${i}" class="text-end">S/ 0.00</td>
            <td id="total-yape-${i}" class="text-end">S/ 0.00</td>
            <td id="acum-cash-${i}" class="text-end">S/ 0.00</td>
            <td id="acum-yape-${i}" class="text-end">S/ 0.00</td>
        `;
        tbody.appendChild(tr);
    }

    document.querySelectorAll('input[data-day]').forEach(input => {
        input.addEventListener('input', (e) => {
            const day = parseInt(e.target.dataset.day);
            const tech = e.target.dataset.tech;
            const type = e.target.dataset.type;
            handleInput(day, tech, type, e.target.value);
        });
        input.addEventListener('change', (e) => {
            handleSave(parseInt(e.target.dataset.day));
        });
    });
}

function handleInput(day, tech, type, value) {
    let dayObj = monthData.days.find(d => d.day === day);
    if (!dayObj) {
        dayObj = { day, st1: { cash: 0, yape: 0 }, st2: { cash: 0, yape: 0 } };
        monthData.days.push(dayObj);
        monthData.days.sort((a, b) => a.day - b.day);
    }
    dayObj[tech][type] = parseNumber(value);
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
    const dayObj = monthData.days.find(d => d.day === day);
    if (!dayObj) return;
    try {
        await saveDayData({
            year: currentYear, month: currentMonth, day: day,
            st1: dayObj.st1, st2: dayObj.st2
        });
        showToast(`Día ${day} guardado`);
    } catch (err) { showToast('Error al guardar', true); }
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
