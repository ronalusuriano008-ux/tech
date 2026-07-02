import { getMonthData, deleteDayData } from './api.js';
import { formatPEN } from './calculations.js';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

const toast = document.getElementById('toast');
const backupJsonBtn = document.getElementById('backupJsonBtn');

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(window.getApiUrl('/auth/check'), { credentials: 'include' });
    const data = await res.json();
    if (!data.logged) return window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
    document.getElementById('userInfo').textContent = `👤 ${data.user.username}`;
  } catch (e) {
    window.AppMessages?.networkError(e, { title: 'No se pudo validar la sesión' });
    return window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
  }

  const monthPicker = document.getElementById('monthPicker');
  monthPicker.value = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  monthPicker.addEventListener('change', (e) => {
    const [y, m] = e.target.value.split('-');
    currentYear = parseInt(y); currentMonth = parseInt(m);
    loadMonth();
  });

  backupJsonBtn.addEventListener('click', downloadBackupJson);

  generateTableStructure();
  await loadMonth();
});

function showToast(msg, isError = false) {
  if (window.AppMessages?.toast) {
    window.AppMessages.toast(msg, isError);
    return;
  }
  toast.textContent = msg;
  toast.className = `app-toast${isError ? ' toast-error' : ' toast-success'}`;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2200);
}

async function loadMonth() {
  try {
    const monthData = await getMonthData(currentYear, currentMonth);
    if (!monthData.days) monthData.days = [];
    renderTableRows(monthData.days);
  } catch (err) {
    console.error('Error loading month:', err);
    window.AppMessages?.networkError(err, { title: 'No se pudo cargar el mes' });
  }
}

function generateTableStructure() {
  const thead = document.getElementById('tableHead');
  thead.innerHTML = `
    <tr>
      <th>Fecha</th>
      <th>ST1 Efectivo</th>
      <th>ST1 Yape</th>
      <th>ST2 Efectivo</th>
      <th>ST2 Yape</th>
      <th>Total Efectivo</th>
      <th>Total Yape</th>
      <th>Acciones</th>
    </tr>
  `;
}

function renderTableRows(days) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  days.sort((a, b) => a.day - b.day);

  for (let i = 1; i <= new Date(currentYear, currentMonth, 0).getDate(); i++) {
    const dayObj = days.find(d => d.day === i);
    const st1Cash = dayObj?.st1?.cash || 0;
    const st1Yape = dayObj?.st1?.yape || 0;
    const st2Cash = dayObj?.st2?.cash || 0;
    const st2Yape = dayObj?.st2?.yape || 0;
    const totalCash = st1Cash + st2Cash;
    const totalYape = st1Yape + st2Yape;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-bold">${i}</td>
      <td class="text-end">${formatPEN(st1Cash)}</td>
      <td class="text-end">${formatPEN(st1Yape)}</td>
      <td class="text-end">${formatPEN(st2Cash)}</td>
      <td class="text-end">${formatPEN(st2Yape)}</td>
      <td class="text-end">${formatPEN(totalCash)}</td>
      <td class="text-end">${formatPEN(totalYape)}</td>
      <td class="text-center">
        <button type="button" class="btn btn-sm btn-outline-primary me-1" data-edit-day="${i}"><i class="fas fa-pen"></i></button>
        <button type="button" class="btn btn-sm btn-outline-danger" data-delete-day="${i}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll('[data-edit-day]').forEach(button => {
    button.addEventListener('click', () => {
      const day = button.getAttribute('data-edit-day');
      window.redirectTo?.(`${window.AppConfig?.fillPath || '/fill.html'}?year=${currentYear}&month=${currentMonth}&day=${day}`);
    });
  });

  tbody.querySelectorAll('[data-delete-day]').forEach(button => {
    button.addEventListener('click', async () => {
      const day = parseInt(button.getAttribute('data-delete-day'));
      if (!day) return;
      if (!confirm(`¿Eliminar los datos del día ${day}/${currentMonth}/${currentYear}?`)) return;
      try {
        const res = await deleteDayData(currentYear, currentMonth, day);
        if (res && res.success) {
          showToast(`Día ${day} eliminado`);
          loadMonth();
        } else {
          showToast('No se pudo eliminar el día', true);
        }
      } catch (err) {
        window.AppMessages?.networkError(err, { title: 'Error al eliminar el día' });
        console.error(err);
      }
    });
  });
}

async function downloadBackupJson() {
  try {
    const diaryUrl = window.getApiUrl ? window.getApiUrl('/diary') : '/api/diary';
    const res = await fetch(diaryUrl);
    if (!res.ok) { showToast('No se pudo descargar backup', true); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diario-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Backup JSON descargado');
  } catch (err) {
    window.AppMessages?.networkError(err, { title: 'Error al descargar backup' });
    console.error(err);
  }
}
