import {
  getTiendaMonth,
  saveTiendaDay,
  deleteTiendaDay,
  recalculateTienda,
  getTiendaPdf
} from './tiendaApi.js';
import { formatCurrency, parseDecimal } from './calculations.js';
import { exportToPDF } from './exportPDF.js';

const yearInput = document.getElementById('year');
const monthInput = document.getElementById('month');
const btnNewDay = document.getElementById('btnNewDay');
const btnGeneratePdf = document.getElementById('btnGeneratePdf');
const statusMessage = document.getElementById('statusMessage');
const summaryTotalEl = document.getElementById('summaryTotal');
const summaryAcumuladoEl = document.getElementById('summaryAcumulado');
const summaryBancoDepositadoEl = document.getElementById('summaryBancoDepositado');
const summarySaldoBancoEl = document.getElementById('summarySaldoBanco');
const tableBody = document.getElementById('tiendaTableBody');
const withdrawalNotesContainer = document.getElementById('withdrawalNotesContainer');

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
const tipoRetiroInput = document.getElementById('tipoRetiro');
const motivoRetiroInput = document.getElementById('motivoRetiro');
const destinoRetiroInput = document.getElementById('destinoRetiro');
const comentarioRetiroInput = document.getElementById('comentarioRetiro');

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
  if (tienda1Input) tienda1Input.value = '';
  if (tienda2Input) tienda2Input.value = '';
  if (tienda3Input) tienda3Input.value = '';
  if (bancoDepositadoInput) bancoDepositadoInput.value = '';
  if (retiroTiendaInput) retiroTiendaInput.value = '';
  if (retiroBancoInput) retiroBancoInput.value = '';
  if (tipoRetiroInput) tipoRetiroInput.value = 'ninguno';
  if (motivoRetiroInput) motivoRetiroInput.value = '';
  if (destinoRetiroInput) destinoRetiroInput.value = '';
  if (comentarioRetiroInput) comentarioRetiroInput.value = '';
}

function clearZeroOnFocus(event) {
  const field = event.currentTarget;
  if (!field || field.value === undefined || field.value === null) return;

  if (field.value === '0' || field.value === '0.00' || field.value === '0.0' || field.value === 0) {
    field.value = '';
  }
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
    if (withdrawalNotesContainer) withdrawalNotesContainer.innerHTML = '<div class="withdrawal-item">No hay retiros registrados para este mes.</div>';
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

  renderWithdrawalNotes(days);
}

function renderWithdrawalNotes(days) {
  if (!withdrawalNotesContainer) return;

  const withdrawalEntries = [...(days || [])]
    .filter((dayData) => {
      const retiroTienda = Number(dayData.retiroTienda || 0);
      const retiroBanco = Number(dayData.retiroBanco || 0);
      return retiroTienda > 0 || retiroBanco > 0;
    })
    .sort((a, b) => Number(b.day || 0) - Number(a.day || 0));

  if (!withdrawalEntries.length) {
    withdrawalNotesContainer.innerHTML = '<div class="withdrawal-item">No hay retiros registrados para este mes.</div>';
    return;
  }

  withdrawalNotesContainer.innerHTML = withdrawalEntries.flatMap((dayData) => {
    const retiroTienda = Number(dayData.retiroTienda || 0);
    const retiroBanco = Number(dayData.retiroBanco || 0);
    const motivo = (dayData.motivoRetiro || 'retiro programado').trim();
    const destino = (dayData.destinoRetiro || 'sin destino especificado').trim();
    const comentario = (dayData.comentarioRetiro || '').trim();
    const tipo = determineRetiroType(dayData);
    const tipos = tipo === 'ambos' ? ['tienda', 'banco'] : tipo === 'tienda' ? ['tienda'] : tipo === 'banco' ? ['banco'] : [];

    return tipos.map((kind) => {
      const isTienda = kind === 'tienda';
      const amount = isTienda ? retiroTienda : retiroBanco;
      if (amount <= 0) return null;

      const accountLabel = isTienda ? 'acumulado de tiendas' : 'acumulado del banco';
      const detail = `por motivo: ${motivo}; dirigido a: ${destino}.`;
      const extra = comentario ? ` Comentario: ${comentario}.` : '';

      return `
        <div class="withdrawal-item">
          <span class="withdrawal-date">Día ${dayData.day}</span>
          <span>Se retiró ${formatCurrency(amount)} del ${accountLabel}. ${detail}${extra}</span>
        </div>
      `;
    }).filter(Boolean);
  }).join('');
}

function determineRetiroType(dayData = {}) {
  const hasTienda = Number(dayData.retiroTienda || 0) > 0;
  const hasBanco = Number(dayData.retiroBanco || 0) > 0;
  const explicitType = String(dayData.tipoRetiro || '').trim().toLowerCase();

  if (explicitType) return explicitType;
  if (hasTienda && hasBanco) return 'ambos';
  if (hasTienda) return 'tienda';
  if (hasBanco) return 'banco';
  return 'ninguno';
}

function fillDayForm(dayData) {
  if (!dayData) return;
  dayInput.value = dayData.day || '';
  tienda1Input.value = dayData.tienda1 ?? '';
  tienda2Input.value = dayData.tienda2 ?? '';
  tienda3Input.value = dayData.tienda3 ?? '';
  bancoDepositadoInput.value = dayData.bancoDepositado ?? '';
  retiroTiendaInput.value = dayData.retiroTienda ?? '';
  retiroBancoInput.value = dayData.retiroBanco ?? '';
  tipoRetiroInput.value = determineRetiroType(dayData);
  motivoRetiroInput.value = dayData.motivoRetiro ?? '';
  destinoRetiroInput.value = dayData.destinoRetiro ?? '';
  comentarioRetiroInput.value = dayData.comentarioRetiro ?? '';
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
    retiroBanco: parseDecimal(retiroBancoInput.value),
    tipoRetiro: (tipoRetiroInput?.value || 'ninguno').trim().toLowerCase(),
    motivoRetiro: (motivoRetiroInput?.value || '').trim(),
    destinoRetiro: (destinoRetiroInput?.value || '').trim(),
    comentarioRetiro: (comentarioRetiroInput?.value || '').trim()
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

const _loadedScripts = new Map();

function loadScriptOnce(url) {
  if (_loadedScripts.has(url)) return _loadedScripts.get(url);

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve(url);
    script.onerror = () => reject(new Error(`Falló la carga de ${url}`));
    document.head.appendChild(script);
  });

  _loadedScripts.set(url, promise);
  return promise;
}

async function handleGeneratePdf() {
  const { year, month } = getSelectedYearMonth();
  if (!year || !month) {
    showStatus('Seleccione año y mes válidos', 'error');
    return;
  }

  try {
    showStatus('Generando PDF...');
    await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
    exportToPDF(year, month, currentDays);
    showStatus('PDF descargado correctamente');
  } catch (error) {
    console.error(error);
    showStatus(error.message || 'Error al generar el PDF', 'error');
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
  const numberFields = [
    dayInput,
    tienda1Input,
    tienda2Input,
    tienda3Input,
    bancoDepositadoInput,
    retiroTiendaInput,
    retiroBancoInput
  ].filter(Boolean);

  if (tipoRetiroInput) {
    tipoRetiroInput.addEventListener('change', () => {
      const value = tipoRetiroInput.value;
      if (value === 'tienda') {
        retiroTiendaInput.value = retiroTiendaInput.value || '';
        retiroBancoInput.value = '';
      }
      if (value === 'banco') {
        retiroBancoInput.value = retiroBancoInput.value || '';
        retiroTiendaInput.value = '';
      }
      if (value === 'ninguno') {
        retiroTiendaInput.value = '';
        retiroBancoInput.value = '';
      }
    });
  }

  numberFields.forEach((field) => {
    field.addEventListener('focus', clearZeroOnFocus);
  });

  if (yearInput) yearInput.addEventListener('change', loadTable);
  if (monthInput) monthInput.addEventListener('change', loadTable);
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
