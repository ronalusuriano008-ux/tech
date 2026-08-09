const { readTDiary, readTMonth, writeTMonth, deleteTDay } = require('./jsonStorage');
const { calcularEstadoFinanciero } = require('./tiendaCalculator');

function getMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Devuelve el resultado del motor para el mes solicitado.
async function getMonth(year, month) {
  return await recalculateMonth(year, month);
}

// Recalcula el mes usando únicamente los movimientos persistidos.
// No persiste valores calculados en el JSON.
async function recalculateMonth(year, month) {
  const diary = await readTDiary();
  const selectedKey = getMonthKey(year, month);

  const monthKeys = Object.keys(diary).sort((a, b) => a.localeCompare(b));

  // Calcular saldos iniciales acumulando meses anteriores (si existen)
  let initialAcumulado = 0;
  let initialSaldoBanco = 0;

  for (const key of monthKeys) {
    if (key >= selectedKey) break;
    const prevMonth = diary[key];
    if (!prevMonth || !Array.isArray(prevMonth.days)) continue;

    const res = calcularEstadoFinanciero(prevMonth, {
      initialAcumuladoTienda: initialAcumulado,
      initialSaldoBanco: initialSaldoBanco
    });

    initialAcumulado = res.resumen.saldoTienda;
    initialSaldoBanco = res.resumen.saldoBanco;
  }

  const selectedMonthData = diary[selectedKey] || { year, month, days: [] };

  const result = calcularEstadoFinanciero(selectedMonthData, {
    initialAcumuladoTienda: initialAcumulado,
    initialSaldoBanco: initialSaldoBanco
  });

  return result;
}

// Persistir únicamente los movimientos originales del día.
async function saveDay(year, month, dayData) {
  const day = Number(dayData.day);

  if (!day || day < 1 || day > 31) {
    throw new Error('Día inválido');
  }

  const bancoDepositado = Number(dayData.bancoDepositado || 0);
  const retiroBanco = Number(dayData.retiroBanco || 0);
  const retiroTienda = Number(dayData.retiroTienda || 0);

  if (bancoDepositado < 0) throw new Error('Banco Depositado no puede ser negativo');
  if (retiroBanco < 0) throw new Error('Retiro Banco no puede ser negativo');
  if (retiroTienda < 0) throw new Error('Retiro Tienda no puede ser negativo');

  const monthData = await readTMonth(year, month);
  if (!monthData.days) monthData.days = [];

  const existingIndex = monthData.days.findIndex(d => Number(d.day) === day);

  const rawDay = {
    day,
    tienda1: Number(dayData.tienda1) || 0,
    tienda2: Number(dayData.tienda2) || 0,
    tienda3: Number(dayData.tienda3) || 0,
    bancoDepositado: bancoDepositado,
    retiroBanco: retiroBanco,
    retiroTienda: retiroTienda
  };

  if (existingIndex !== -1) {
    monthData.days[existingIndex] = { ...monthData.days[existingIndex], ...rawDay };
  } else {
    monthData.days.push(rawDay);
  }

  monthData.days.sort((a, b) => Number(a.day) - Number(b.day));

  // Guardar solo movimientos (sin campos calculados)
  await writeTMonth({ year, month, days: monthData.days });

  return await recalculateMonth(year, month);
}

async function deleteDay(year, month, day) {
  await deleteTDay(year, month, day);
  return await recalculateMonth(year, month);
}

module.exports = {
  getMonth,
  saveDay,
  deleteDay,
  recalculateMonth
};