import {
  getTiendaMonth,
  saveTiendaDay,
  deleteTiendaDay,
  recalculateTienda,
  getTiendaPdf
} from './tiendaApi.js';
import { formatCurrency, parseDecimal } from './calculations.js';

const yearInput = document.getElementById('year');
const monthInput = document.getElementById('month');
const btnLoad = document.getElementById('btnLoad');
const btnNewDay = document.getElementById('btnNewDay');
const btnRecalculate = document.getElementById('btnRecalculate');
const btnGeneratePdf = document.getElementById('btnGeneratePdf');
const statusMessage = document.getElementById('statusMessage');
const summaryTotalEl = document.getElementById('summaryTotal');
const summaryAcumuladoEl = document.getElementById('summaryAcumulado');
const summaryBancoDepositadoEl = document.getElementById('summaryBancoDepositado');
const summarySaldoBancoEl = document.getElementById('summarySaldoBanco');
const tableBody = document.getElementById('tiendaTableBody');

const dayModal = document.getElementById('dayModal');
const dayForm = document.getElementById('dayForm');
const closeModalBtn = document.getElementById('closeModal');
const cancelModalBtn = document.getElementById('cancelModal');
const modalTitle = document.getElementById('modalTitle');

const dayInput = document.getElementById('day');
const tienda1Input = document.getElementById('tienda1');
const tienda2Input = document.getElementById('tienda2');
const tienda3Input = document.getElementById('tienda3');
const bancoDepositadoInput = document.getElementById('bancoDepositado');
const retiroTiendaInput = document.getElementById('retiroTienda');
const retiroBancoInput = document.getElementById('retiroBanco');

let currentDays = [];
let statusTimeout = null;

function showStatus(message, type = 'success') {
  if (!statusMessage) {
    console.log(`${type}: ${message}`);
    return;
  }
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type === 'error' ? 'status-error' : 'status-success'}`;
  if (statusTimeout) window.clearTimeout(statusTimeout);
  statusTimeout = window.setTimeout(() => {
    statusMessage.textContent = '';
  }, 3500);
}

function openModal() {
  if (!dayModal) return;
  dayModal.style.display = 'flex';
}

function closeModal() {
  if (!dayModal) return;
  dayModal.style.display = 'none';
  dayForm.reset();
  resetDayForm();
}

function resetDayForm() {
  if (dayInput) dayInput.value = '';
  if (tienda1Input) tienda1Input.value = '0';
  if (tienda2Input) tienda2Input.value = '0';
  if (tienda3Input) tienda3Input.value = '0';
  if (bancoDepositadoInput) bancoDepositadoInput.value = '0';
  if (retiroTiendaInput) retiroTiendaInput.value = '0';
  if (retiroBancoInput) retiroBancoInput.value = '0';
}

function getSelectedYearMonth() {
  const year = Number(yearInput?.value || 0);
  const month = Number(monthInput?.value || 0);
  return { year, month };
}

async function loadTable() {
  const { year, month } = getSelectedYearMonth();

  if (!year || !month) {
    showStatus('Seleccione año y mes válidos', 'error');
    return;
  }

  try {
    const response = await getTiendaMonth(year, month);
    const days = response.dias || [];
    const resumen = response.resumen || {};
    currentDays = days;
    renderTable(days);
    renderSummary(resumen);
  } catch (error) {
    showStatus(error.message || 'No se pudo cargar el mes', 'error');
  }
}

function renderSummary(resumen = {}) {
  if (summaryTotalEl) { summaryTotalEl.textContent = formatCurrency(resumen.totalMes || 0); summaryTotalEl.className = 'money-positive'; }
  if (summaryAcumuladoEl) { summaryAcumuladoEl.textContent = formatCurrency(resumen.saldoTienda || 0); summaryAcumuladoEl.className = Number(resumen.saldoTienda || 0) < 0 ? 'money-negative' : 'money-positive'; }
  if (summaryBancoDepositadoEl) summaryBancoDepositadoEl.textContent = formatCurrency(resumen.bancoDepositado || 0);
  if (summarySaldoBancoEl) { summarySaldoBancoEl.textContent = formatCurrency(resumen.saldoBanco || 0); summarySaldoBancoEl.className = Number(resumen.saldoBanco || 0) < 0 ? 'money-negative' : 'money-positive'; }
}

function renderTable(days) {
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (!days || days.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="11" class="text-center">No hay datos registrados para este mes.</td></tr>';
    return;
  }

  days.forEach((dayData) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${dayData.day}</td>
      <td class="money-positive">${formatCurrency(dayData.tienda1)}</td>
      <td class="money-positive">${formatCurrency(dayData.tienda2)}</td>
      <td class="money-positive">${formatCurrency(dayData.tienda3)}</td>
      <td class="money-positive">${formatCurrency(dayData.totalDiario)}</td>
      <td class="money-positive">${formatCurrency(dayData.bancoDepositado)}</td>
      <td class="money-negative">${formatCurrency(dayData.retiroTienda)}</td>
      <td class="money-negative">${formatCurrency(dayData.retiroBanco)}</td>
      <td class="${Number(dayData.saldoBanco) < 0 ? 'money-negative' : 'money-positive'}">${formatCurrency(dayData.saldoBanco)}</td>
      <td class="${Number(dayData.acumuladoTienda) < 0 ? 'money-negative' : 'money-positive'}">${formatCurrency(dayData.acumuladoTienda)}</td>
      <td>
        <button class="btn-edit" data-id="${dayData.day}">Editar</button>
        <button class="btn-delete" data-id="${dayData.day}">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function fillDayForm(dayData) {
  if (!dayData) return;
  dayInput.value = dayData.day || '';
  tienda1Input.value = dayData.tienda1 ?? 0;
  tienda2Input.value = dayData.tienda2 ?? 0;
  tienda3Input.value = dayData.tienda3 ?? 0;
  bancoDepositadoInput.value = dayData.bancoDepositado ?? 0;
  retiroTiendaInput.value = dayData.retiroTienda ?? 0;
  retiroBancoInput.value = dayData.retiroBanco ?? 0;
}

async function handleSaveDay(event) {
  event.preventDefault();
  const { year, month } = getSelectedYearMonth();

  if (!year || !month) {
    showStatus('Seleccione año y mes válidos', 'error');
    return;
  }

  const data = {
    day: Number(dayInput.value),
    tienda1: parseDecimal(tienda1Input.value),
    tienda2: parseDecimal(tienda2Input.value),
    tienda3: parseDecimal(tienda3Input.value),
    bancoDepositado: parseDecimal(bancoDepositadoInput.value),
    retiroTienda: parseDecimal(retiroTiendaInput.value),
    retiroBanco: parseDecimal(retiroBancoInput.value)
  };

  try {
    await saveTiendaDay(year, month, data);
    closeModal();
    await loadTable();
    showStatus('Día guardado correctamente');
  } catch (error) {
    showStatus(error.message || 'Error al guardar el día', 'error');
  }
}

async function handleTableAction(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const dayId = Number(button.dataset.id);
  if (!dayId) return;

  if (button.classList.contains('btn-edit')) {
    const dayData = currentDays.find((d) => Number(d.day) === dayId);
    if (!dayData) return;
    modalTitle.textContent = 'Editar Día';
    fillDayForm(dayData);
    openModal();
    return;
  }

  if (button.classList.contains('btn-delete')) {
    if (!confirm(`¿Está seguro de eliminar el día ${dayId}?`)) return;
    try {
      const { year, month } = getSelectedYearMonth();
      await deleteTiendaDay(year, month, dayId);
      await loadTable();
      showStatus('Día eliminado correctamente');
    } catch (error) {
      showStatus(error.message || 'Error al eliminar el día', 'error');
    }
  }
}

async function handleGeneratePdf() {
  const { year, month } = getSelectedYearMonth();
  if (!year || !month) {
    showStatus('Seleccione año y mes válidos', 'error');
    return;
  }

  try {
    showStatus('Descargando PDF...');
    const blob = await getTiendaPdf(year, month);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tienda-${year}-${String(month).padStart(2, '0')}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showStatus('PDF descargado correctamente');
  } catch (error) {
    showStatus(error.message || 'Error al descargar el PDF', 'error');
  }
}

async function handleRecalculate() {
  const { year, month } = getSelectedYearMonth();
  if (!year || !month) {
    showStatus('Seleccione año y mes válidos', 'error');
    return;
  }

  try {
    showStatus('Recalculando...');
    await recalculateTienda(year, month);
    await loadTable();
    showStatus('Mes recalculado correctamente');
  } catch (error) {
    showStatus(error.message || 'Error al recalcular el mes', 'error');
  }
}

function attachModalCloseActions() {
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
  window.addEventListener('click', (event) => {
    if (event.target === dayModal) closeModal();
  });
}

function initializePage() {
  const today = new Date();
  if (yearInput) yearInput.value = today.getFullYear();
  if (monthInput) monthInput.value = today.getMonth() + 1;
  if (dayInput) dayInput.value = today.getDate();
}

function attachEventListeners() {
  if (btnLoad) btnLoad.addEventListener('click', loadTable);
  if (btnNewDay) {
    btnNewDay.addEventListener('click', () => {
      modalTitle.textContent = 'Registrar Día';
      dayForm.reset();
      resetDayForm();
      const today = new Date();
      if (yearInput) yearInput.value = today.getFullYear();
      if (monthInput) monthInput.value = today.getMonth() + 1;
      if (dayInput) dayInput.value = today.getDate();
      openModal();
    });
  }
  if (btnRecalculate) btnRecalculate.addEventListener('click', handleRecalculate);
  if (btnGeneratePdf) btnGeneratePdf.addEventListener('click', handleGeneratePdf);
  if (dayForm) dayForm.addEventListener('submit', handleSaveDay);
  if (tableBody) tableBody.addEventListener('click', handleTableAction);
}

document.addEventListener('DOMContentLoaded', async () => {
  initializePage();
  attachModalCloseActions();
  attachEventListeners();
  await loadTable();
});
