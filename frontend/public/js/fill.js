import { getMonthData, saveDayData, deleteDayData } from './api.js';

const form = document.getElementById('diaryForm');
const toast = document.getElementById('toast');
const rawJson = document.getElementById('rawJson');
const deleteDayButton = document.getElementById('deleteDayButton');
const backupJsonBtn = document.getElementById('backupJsonBtn');

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.className = `app-toast${isError ? ' toast-error' : ' toast-success'}`;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2200);
}

function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

async function loadDayFromQuery() {
  const params = getQueryParams();
  if (!params.year || !params.month || !params.day) return;
  document.getElementById('year').value = params.year;
  document.getElementById('month').value = params.month;
  document.getElementById('day').value = params.day;

  try {
    const monthData = await getMonthData(parseInt(params.year), parseInt(params.month));
    const dayObj = monthData.days.find(d => d.day === parseInt(params.day));
    if (dayObj) {
      document.getElementById('st1_cash').value = dayObj.st1.cash;
      document.getElementById('st1_yape').value = dayObj.st1.yape;
      document.getElementById('st2_cash').value = dayObj.st2.cash;
      document.getElementById('st2_yape').value = dayObj.st2.yape;
      deleteDayButton.classList.remove('d-none');
    }
  } catch (err) {
    console.error('No se pudo cargar el día desde query:', err);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const year = parseInt(document.getElementById('year').value);
  const month = parseInt(document.getElementById('month').value);
  const day = parseInt(document.getElementById('day').value);
  const st1_cash = parseFloat(document.getElementById('st1_cash').value) || 0;
  const st1_yape = parseFloat(document.getElementById('st1_yape').value) || 0;
  const st2_cash = parseFloat(document.getElementById('st2_cash').value) || 0;
  const st2_yape = parseFloat(document.getElementById('st2_yape').value) || 0;

  if (!year || !month || !day) { showToast('Completa año/mes/día', true); return; }

  const payload = {
    year, month, day,
    st1: { cash: st1_cash, yape: st1_yape },
    st2: { cash: st2_cash, yape: st2_yape }
  };

  try {
    const res = await saveDayData(payload);
    if (res && res.success) {
      showToast('Entrada guardada');
      deleteDayButton.classList.remove('d-none');
      await fetchRawJson();
    } else {
      showToast('Error al guardar', true);
    }
  } catch (err) {
    showToast('Error de conexión', true);
    console.error(err);
  }
});

async function deleteCurrentDay() {
  const year = parseInt(document.getElementById('year').value);
  const month = parseInt(document.getElementById('month').value);
  const day = parseInt(document.getElementById('day').value);
  if (!year || !month || !day) return;
  if (!confirm(`¿Eliminar los datos del día ${day}/${month}/${year}?`)) return;

  try {
    const res = await deleteDayData(year, month, day);
    if (res && res.success) {
      showToast('Día eliminado');
      deleteDayButton.classList.add('d-none');
      form.reset();
      fetchRawJson();
    } else {
      showToast('No se pudo eliminar', true);
    }
  } catch (err) {
    showToast('Error de conexión', true);
    console.error(err);
  }
}

async function fetchRawJson() {
  try {
    const res = await fetch('/data/diario.json');
    if (!res.ok) { rawJson.textContent = `Error: ${res.status}`; return; }
    const data = await res.json();
    rawJson.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    rawJson.textContent = 'No se pudo obtener JSON crudo';
  }
}

async function downloadBackupJson() {
  try {
    const res = await fetch('/data/diario.json');
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
    showToast('Error al descargar backup', true);
    console.error(err);
  }
}

document.getElementById('fetchRaw').addEventListener('click', fetchRawJson);
deleteDayButton.addEventListener('click', deleteCurrentDay);
backupJsonBtn.addEventListener('click', downloadBackupJson);

document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  document.getElementById('year').value = now.getFullYear();
  document.getElementById('month').value = now.getMonth() + 1;
  fetchRawJson();
  loadDayFromQuery();
});
